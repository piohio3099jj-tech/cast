const { EmbedBuilder, Client } = require('discord.js');
const db = require('pro.db');

module.exports = {
    data: {
        name: 'links',
        description: 'Generates invite links for all bots'
    },
    async execute(client, message, args) {
        const Bot = db.get(`bot_${client.user.id}`) || {};
        if (!Bot.botOwner || Bot.botOwner !== message.author.id) {
            return message.reply({
                embeds: [new EmbedBuilder()
                    .setDescription('`❌ You do not have permission to use this command`')
                    .setColor(0xff0000)] // لون أحمر
            });
        }

        const tokens = db.get(`tokens_${client.user.id}`) || []; // الحصول على الرموز
        let botLinks = '';

        // إرسال رد سريع
        const quickReply = await message.reply({
            embeds: [new EmbedBuilder()
                .setDescription('`🚀 Generating invite links...`')
                .setColor(0xffffff)] // لون أبيض
        });

        for (const token of tokens) {
            try {
                const tempClient = new Client({
                    intents: ['Guilds']
                });
                await tempClient.login(token);
                const botId = tempClient.user.id;
                const inviteLink = `https://discord.com/oauth2/authorize?client_id=${botId}&scope=bot&permissions=8`;
                botLinks += `${inviteLink}\n`;
                await tempClient.destroy();
            } catch (error) {
                console.error(`Failed to login with token: ${token}`);
            }
        }

        if (botLinks.length === 0) {
            return quickReply.edit({
                embeds: [new EmbedBuilder()
                    .setDescription('`❌ No bot invite links generated`')
                    .setColor(0xff0000)] // لون أحمر
            });
        }

        // تعديل الرد السريع لعرض الروابط النهائية
        await quickReply.edit({
            embeds: [new EmbedBuilder()
                .setDescription(`\`✅ Bot invite links:\n${botLinks}\``)
                .setColor(0xffffff)] // لون أبيض
        });
    }
};
