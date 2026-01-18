const { Client, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const db = require('pro.db');

module.exports = {
    data: {
        name: 'avatar',
        description: 'Change avatars for all bots',
    },
    async execute(client, Message, args) {
        const Bot = db.get(`bot_${client.user.id}`) || {};
        if (!Bot.botOwner || Bot.botOwner !== Message.author.id) {
            return Message.reply({ embeds: [new EmbedBuilder()
                .setDescription('**❌ You do not have permission to use this command**')
                .setColor(0xff0000)] }); 
        }

        const tokens = db.get(`tokens_${client.user.id}`) || [];
        if (tokens.length === 0) {
            return Message.reply({ embeds: [
                new EmbedBuilder()
                    .setDescription('**❌ No bots found to change avatar**')
                    .setColor(0xff0000) 
            ]});
        }

        const quickReply = await Message.reply({
            embeds: [new EmbedBuilder()
                .setDescription('**🚀 Changing avatars for bots...**')
                .setColor(0xffffff)] 
        });

        let successCount = 0;
        let failCount = 0;

        const avatarsPath = path.join(__dirname, '..', 'avatars.txt');
        const avatars = fs.readFileSync(avatarsPath, 'utf-8').split('\n').filter(Boolean);

        for (const token of tokens) {
            try {
                const tempClient = new Client({
                    intents: ['Guilds']
                });
                await tempClient.login(token);

                const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)];
                await tempClient.user.setAvatar(randomAvatar);
                successCount++;

                await tempClient.destroy();
            } catch (error) {
                console.error(`Failed to change avatar for bot with token: ${token}`);
                failCount++;
            }
        }

        await quickReply.edit({ embeds: [
            new EmbedBuilder()
                .setDescription(`**✅ Changed avatar for **${successCount}** bot(s).\n❌ Failed to change avatar for **${failCount}** bot(s).**`)
                .setColor(0xffffff) 
        ]});
    }
};
