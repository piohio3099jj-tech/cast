const { Client, EmbedBuilder } = require('discord.js');
const db = require('pro.db');

module.exports = {
    data: {
        name: 'leave',
        description: 'Make all bots leave their current servers',
    },
    execute: async (client, message, args) => {
        // إرسال رد سريع
        const quickReply = await message.reply({
            embeds: [new EmbedBuilder()
                .setDescription('**`🚀 Processing your request...`**')
                .setColor(0xffffff)] // لون أبيض
        });

        if (!message.member.permissions.has('Administrator')) {
            return quickReply.edit({
                embeds: [new EmbedBuilder()
                    .setDescription('**`❌ You do not have permission to use this command`**')
                    .setColor(0xff0000)] // لون أحمر
            });
        }

        const tokens = db.get(`tokens_${client.user.id}`) || []; // الحصول على الرموز
        let leaveResults = '';

        for (const token of tokens) {
            try {
                const tempClient = new Client({
                    intents: ['Guilds']
                });
                await tempClient.login(token);
                const guilds = tempClient.guilds.cache;

                for (const guild of guilds.values()) {
                    await guild.leave();
                    leaveResults += `**\`${tempClient.user.username}\`** left server: **${guild.name}**\n`;
                }

                await tempClient.destroy();
            } catch (error) {
                console.error(`Failed to process token: ${token}`);
                leaveResults += `**❌ Failed to process a bot with token: ${token}**\n`;
            }
        }

        // تعديل الرد السريع لعرض النتائج النهائية
        await quickReply.edit({
            embeds: [new EmbedBuilder()
                .setTitle('Leave Results')
                .setDescription(leaveResults || '**`No actions performed`**')
                .setColor(0xffffff)] // لون أبيض
        });
    },
};
