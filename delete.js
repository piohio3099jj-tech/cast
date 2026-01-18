const { Client, EmbedBuilder } = require('discord.js');
const db = require('pro.db');

module.exports = {
    data: {
        name: 'delete',
        description: 'Delete a bot by its ID',
    },
    execute: async (client, message, args) => {
        if (!message.member.permissions.has('Administrator')) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setDescription('\`❌ You do not have permission to use this command\`')
                        .setColor(0xff0000) 
                ]
            });
        }

        const botId = args[0];

        if (!botId) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setDescription('\`❌ Please provide a bot ID to delete\`')
                        .setColor(0xff0000) 
                ]
            });
        }

        const tokens = db.get(`tokens_${client.user.id}`) || []; 
        let deletedToken = null;
        let deletedBotUsername = null;

        const quickReply = await message.reply({
            embeds: [
                new EmbedBuilder()
                    .setDescription('**`🚀 Processing your request...`**')
                    .setColor(0xffffff) 
            ]
        });

        for (const token of tokens) {
            try {
                const tempClient = new Client({
                    intents: ['Guilds']
                });
                await tempClient.login(token);

                if (tempClient.user.id === botId) {
                    deletedToken = token;
                    deletedBotUsername = tempClient.user.username;
                    await tempClient.destroy();
                    break;
                }

                await tempClient.destroy();
            } catch (error) {
                console.error(`Failed to process token: ${token}`);
            }
        }

        if (!deletedToken) {
            return quickReply.edit({
                embeds: [
                    new EmbedBuilder()
                        .setDescription('\`❌ Invalid bot ID or bot not found\`')
                        .setColor(0xff0000) 
                ]
            });
        }

        const updatedTokens = tokens.filter(token => token !== deletedToken);
        db.set(`tokens_${client.user.id}`, updatedTokens); 

        await quickReply.edit({
            embeds: [
                new EmbedBuilder()
                    .setDescription(`\`✅ Bot ${deletedBotUsername} (ID: ${botId}) has been deleted\``)
                    .setColor(0xffffff) 
            ]
        });
    }
};
