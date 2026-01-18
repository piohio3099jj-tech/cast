const { Client, EmbedBuilder } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');
const db = require('pro.db');

module.exports = {
    data: {
        name: 'profile',
        description: 'Update profiles (avatar and name) for all bots',
    },
    execute: async (client, Message, args) => {
        const tokens = db.get(`tokens_${client.user.id}`) || [];

        if (tokens.length === 0) {
            return Message.reply({ embeds: [
                new EmbedBuilder()
                    .setDescription('`❌ No bots found to update profiles`')
                    .setColor(0xff0000) // لون أحمر
            ]});
        }

        // إرسال رد سريع
        const quickReply = await Message.reply({
            embeds: [new EmbedBuilder()
                .setDescription('`**🚀 Updating profiles for bots...**`')
                .setColor(0xffffff)] // لون أبيض
        });

        const avatarsPath = path.join(__dirname, '..', 'avatars.txt');
        const namesPath = path.join(__dirname, '..', 'names.txt');
        const [avatars, names] = await Promise.all([
            fs.readFile(avatarsPath, 'utf-8').then(data => data.split('\n').filter(Boolean)),
            fs.readFile(namesPath, 'utf-8').then(data => data.split('\n').filter(Boolean))
        ]);

        let successCount = 0;
        let failCount = 0;

        const updatePromises = tokens.map(async (token) => {
            try {
                const tempClient = new Client({
                    intents: ['Guilds']
                });
                await tempClient.login(token);

                const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)];
                const randomName = names[Math.floor(Math.random() * names.length)];

                await Promise.all([
                    tempClient.user.setAvatar(randomAvatar),
                    tempClient.user.setUsername(randomName)
                ]);
                successCount++;

                await tempClient.destroy();
            } catch (error) {
                console.error(`Failed to update profile for bot with token: ${token}`);
                failCount++;
            }
        });

        await Promise.all(updatePromises);

        // تعديل الرد السريع لعرض النتائج النهائية
        await quickReply.edit({ embeds: [
            new EmbedBuilder()
                .setDescription(`\`✅ Updated profiles for **${successCount}** bot(s).\n❌ Failed to update profiles for **${failCount}** bot(s).\``)
                .setColor(0xffffff) // لون أبيض
        ]});
    }
};
