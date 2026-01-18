const { EmbedBuilder } = require('discord.js');
const db = require('pro.db');
module.exports = {
    name: 'vip-name',
    cooldown: 10,

    execute: async(Client, Message) => {
        const Bot = db.get(`bot_${Client.user.id}`) || {};
        if (!Bot.botOwner || Message.author.id !== Bot.botOwner) return Message.reply({ content: `لست مالك البوت`});
        const newName = Message.content.split(' ').slice(1).join(' ');
        if (!newName) return Message.reply({ content: `**برجاء ادخال الاسم الجديد**` });
        try {
            await Client.user.setUsername(newName);
            Message.reply({ content: `**تم تغيير اسم البوت بنجاح**` }).then(async (msg) => {
                await msg.edit({ content: ``, embeds: [new EmbedBuilder().setColor('Random').setThumbnail(Client.user.displayAvatarURL()).setTimestamp().setTitle('VIP Name').setDescription(`**تم تغيير اسم البوت الى ${newName}**`)] });
            }).catch((err) => {
                console.log(err);
            });
        } catch (err) {
            Message.reply({ content: `**حدث خطأ أثناء تغيير اسم البوت**` });
            console.log(err);
        }
    }
}
