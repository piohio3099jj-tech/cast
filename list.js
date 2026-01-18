const { Client, EmbedBuilder } = require('discord.js');
const db = require('pro.db');

module.exports = {
    data: {
        name: 'list',
        description: 'List all bots',
    },
    execute: async (client, message, args) => {
        // تحقق من إذن المستخدم
        if (!message.member.permissions.has('Administrator')) {
            return message.reply({ embeds: [
                new EmbedBuilder()
                    .setDescription('`❌ You do not have permission to use this command`')
                    .setColor(0xff0000) // لون أحمر
            ]});
        }

        const tokens = db.get(`tokens_${client.user.id}`) || []; // الحصول على الرموز
        let botInfo = '';

        // التحقق مما إذا كانت هناك بوتات
        if (tokens.length === 0) {
            return message.reply({ embeds: [
                new EmbedBuilder()
                    .setDescription('`❌ No bots found`')
                    .setColor(0xff0000) // لون أحمر
            ]});
        }

        // إرسال رد سريع
        const quickReply = await message.reply({
            embeds: [new EmbedBuilder()
                .setDescription('`🚀 Listing bots...`')
                .setColor(0xffffff)] // لون أبيض
        });

        // استرجاع معلومات البوتات
        for (const token of tokens) {
            try {
                const tempClient = new Client({
                    intents: ['Guilds']
                });
                await tempClient.login(token);
                const botName = tempClient.user.username;
                const botId = tempClient.user.id;
                botInfo += `Bot Name: ${botName}\nBot ID: ${botId}\n\n`;
                await tempClient.destroy();
            } catch (error) {
                console.error(`Failed to login with token: ${token}`);
            }
        }

        // تعديل الرد السريع لعرض المعلومات النهائية
        await quickReply.edit({ embeds: [
            new EmbedBuilder()
                .setTitle('Bot List')
                .setDescription(botInfo || '`No bots found`')
                .setColor(0xffffff) // لون أبيض
        ]});
    }
};
