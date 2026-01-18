const { EmbedBuilder } = require('discord.js');
const db = require('pro.db');
module.exports = {
    name: 'vip-prefix',
    cooldown: 10,

    execute: async(Client, Message) => {
        const Bot = db.get(`bot_${Client.user.id}`) || {};
        if (!Bot.botOwner || Message.author.id !== Bot.botOwner) return Message.reply({ content: `لست مالك البوت`});
        const newPrefix = Message.content.split(' ')[1];
        if (!newPrefix) return Message.reply({ content: `**برجاء ادخال البرفكس الجديد**` });
        try {
            db.set(`bot_${Client.user.id}`, { ...Bot, botPrefix: newPrefix });
            Message.reply({ content: `**تم تغيير برفكس البوت بنجاح**` }).then(async (msg) => {
                await msg.edit({ content: ``, embeds: [new EmbedBuilder().setColor('Random').setThumbnail(Client.user.displayAvatarURL()).setTimestamp().setTitle('VIP Prefix').setDescription(`**تم تغيير برفكس البوت الى ${newPrefix}**`)] });
            }).catch((err) => {
                console.log(err);
            });
        } catch (err) {
            Message.reply({ content: `**حدث خطأ أثناء تغيير برفكس البوت**` });
            console.log(err);
        }
    }
}
