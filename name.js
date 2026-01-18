const { Client, EmbedBuilder } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');
const db = require('pro.db');

module.exports = {
    data: {
        name: 'name',
        description: 'Rename bots with random names from a file',
    },
    execute: async (client, Message, args) => {
        const tokens = db.get(`tokens_${client.user.id}`) || []; // إضافة || []

        if (tokens.length === 0) {
            return Message.reply({ embeds: [
                new EmbedBuilder()
                    .setDescription('`❌ No bots found to rename`')
                    .setColor(0xff0000) // لون أحمر
            ]});
        }

        // إرسال رد سريع
        const quickReply = await Message.reply({
            embeds: [new EmbedBuilder()
                .setDescription('`**🚀 Renaming bots...**`')
                .setColor(0xffffff)] // لون أبيض
        });

        let successCount = 0;
        let failCount = 0;

        const namesPath = path.join(__dirname, '..', 'names.txt');
        const names = (await fs.readFile(namesPath, 'utf-8')).split('\n').filter(Boolean);

        for (const token of tokens) {
            try {
                const tempClient = new Client({
                    intents: ['Guilds']
                });
                await tempClient.login(token);

                const randomName = names[Math.floor(Math.random() * names.length)];

                await tempClient.user.setUsername(randomName);
                successCount++;

                await tempClient.destroy();
            } catch (error) {
                console.error(`Failed to rename bot with token: ${token}`);
                failCount++;
            }
        }

        // تعديل الرد السريع لعرض النتائج النهائية
        await quickReply.edit({ embeds: [
            new EmbedBuilder()
                .setDescription(`\`✅ Renamed **${successCount}** bot(s) with random names.\n:x: Failed to rename **${failCount}** bot(s).\``)
                .setColor(0xffffff) // لون أبيض
        ]});
    }
};
