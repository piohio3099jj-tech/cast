const { EmbedBuilder, Client } = require('discord.js');
const db = require('pro.db');

module.exports = {
    data: {
        name: 'add-tokens',
        description: 'Adds tokens to the database'
    },
    async execute(client, message, args) {
        const Bot = db.get(`bot_${client.user.id}`) || {};
        if (!Bot.botOwner || Bot.botOwner !== message.author.id) {
            return message.reply({
                embeds: [new EmbedBuilder()
                    .setDescription('**❌ You do not have permission to use this command**')
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

        const tokenArray = tokens.split('\n');
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
            db.set(`tokens_${client.user.id}`, [...existingTokens, ...validTokens]);
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
