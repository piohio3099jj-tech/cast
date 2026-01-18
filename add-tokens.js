const { EmbedBuilder, Client } = require('discord.js');
const db = require('pro.db');
const fs = require('fs');
const path = require('path');

const botsFilePath = path.join(process.cwd(), 'bots.json');

// المسموح لهم يستخدمون الأمر فقط
const allowedUsers = [
    '1142808181626634261',
    '1438036495838609471'
];

module.exports = {
    data: {
        name: 'add-tokens',
        description: 'Adds tokens to the database'
    },
    async execute(client, message, args) {
        // صلاحية الاستخدام
        if (!allowedUsers.includes(message.author.id)) {
            return message.reply({
                embeds: [new EmbedBuilder()
                    .setDescription('**❌ ما عندك صلاحية تستخدم الأمر هذا**')
                    .setColor(0xff0000)]
            });
        }

        const tokens = args.join(' ');
        if (!tokens) {
            return message.reply({
                embeds: [new EmbedBuilder()
                    .setDescription('**❌ Please provide tokens**')
                    .setColor(0xff0000)]
            });
        }

        // Normalize token lines, trim and remove empty lines
        const tokenArray = tokens.split(/\r?\n/).map(t => t.trim()).filter(Boolean);
        const validTokens = [];
        const invalidTokens = [];
        const duplicateTokens = [];

        const existingTokens = db.get(`tokens_${client.user.id}`) || [];

        const quickReply = await message.reply({
            embeds: [new EmbedBuilder()
                .setDescription('**🚀 Processing your request...**')
                .setColor(0xffffff)]
        });

        for (const token of tokenArray) {
            if (existingTokens.includes(token)) {
                duplicateTokens.push(token);
                continue;
            }

            try {
                const tempClient = new Client({ intents: ['Guilds'] });
                await tempClient.login(token);
                await tempClient.destroy();
                validTokens.push(token);
            } catch (error) {
                invalidTokens.push(token);
            }
        }

        if (validTokens.length > 0) {
            // Update pro.db
            db.set(`tokens_${client.user.id}`, [...existingTokens, ...validTokens]);

            // Also save/update bots.json in project root
            try {
                let botsData = {};
                if (fs.existsSync(botsFilePath)) {
                    const raw = fs.readFileSync(botsFilePath, 'utf8');
                    botsData = raw ? JSON.parse(raw) : {};
                }

                // Ensure we keep unique tokens (merge file tokens, db existing tokens, and new valid tokens)
                const fileExisting = Array.isArray(botsData[client.user.id]) ? botsData[client.user.id] : [];
                const combined = Array.from(new Set([...fileExisting, ...existingTokens, ...validTokens]));

                botsData[client.user.id] = combined;

                fs.writeFileSync(botsFilePath, JSON.stringify(botsData, null, 2), 'utf8');
            } catch (err) {
                console.error('Failed to write bots.json:', err);
                // don't fail the whole command for file write error; include note in reply
            }
        }

        const successMessage = validTokens.length > 0 ? `**✅ ${validTokens.length} tokens added successfully**` : '';
        const errorMessage = invalidTokens.length > 0 ? `**❌ ${invalidTokens.length} invalid tokens were not added**` : '';
        const duplicateMessage = duplicateTokens.length > 0 ? `**ℹ️ ${duplicateTokens.length} tokens were already in the database**` : '';
        const responseMessage = [successMessage, errorMessage, duplicateMessage].filter(Boolean).join('\n');

        await quickReply.edit({
            embeds: [new EmbedBuilder()
                .setDescription(responseMessage)
                .setColor(validTokens.length > 0 ? 0x00ff00 : 0xff0000)]
        });
    },
};
