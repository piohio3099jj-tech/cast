const { EmbedBuilder } = require('discord.js');
const db = require('pro.db');
module.exports = {
    name: 'vip-avatar',
    cooldown: 10,

    execute: async(Client, Message) => {
        const Bot = db.get(`bot_${Client.user.id}`) || {};
        if (!Bot.botOwner || Message.author.id !== Bot.botOwner) return Message.reply({ content: `لست مالك البوت`});
        const newAvatarUrl = Message.content.split(' ')[1];
        if (!newAvatarUrl) return Message.reply({ content: `**برجاء ادخال رابط الصورة الجديدة**` });
        try {
            await Client.user.setAvatar(newAvatarUrl);
            Message.reply({ content: `**تم تغيير صورة البوت بنجاح**` }).then(async (msg) => {
                await msg.edit({ content: ``, embeds: [new EmbedBuilder().setColor('Random').setThumbnail(newAvatarUrl).setTimestamp().setTitle('VIP Avatar').setDescription(`**تم تغيير صورة البوت**`)] });
            }).catch((err) => {
                console.log(err);
            });
        } catch (err) {
            Message.reply({ content: `**حدث خطأ أثناء تغيير صورة البوت**` });
            console.log(err);
        }
    }
}
