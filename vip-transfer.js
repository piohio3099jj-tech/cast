const { EmbedBuilder } = require('discord.js');
const db = require('pro.db');

module.exports = {
    name: 'vip-transfer',
    cooldown: 10,

    execute: async (Client, Message) => {
        // تحقق من أن المستخدم لديه صلاحيات إدارية
        if (!Message.member.permissions.has('Administrator')) return Message.reply({ content: '⚠️ **ليس لديك صلاحيات كافية!**' });

        // الحصول على معرف العضو الجديد
        const newOwnerId = Message.mentions.members.first()?.id; // استخدام optional chaining
        if (!newOwnerId) return Message.reply({ content: '**برجاء ادخال معرف الشخص الجديد**' });

        const newOwner = Message.guild.members.cache.get(newOwnerId);
        if (!newOwner) return Message.reply({ content: `**لم يتم العثور على العضو بمعرف ${newOwnerId}**` });

        // استرداد بيانات البوت من قاعدة البيانات
        const Bot = db.get(`bot_${Client.user.id}`) || {};
        if (!Bot || !Bot.botOwner) return Message.reply({ content: '**لم يتم العثور على بيانات البوت في قاعدة البيانات.**' });

        // تحقق من أن المستخدم هو المالك الحالي
        if (Message.author.id !== Bot.botOwner) return Message.reply({ content: '🚫 **لست مالك البوت.**' });

        // تحقق مما إذا كان المالك الحالي هو نفسه العضو الجديد
        const currentOwner = Bot.botOwner;
        if (currentOwner === newOwnerId) return Message.reply({ content: `**${newOwner} هو الاونر الحالي بالفعل**` });

        // تحديث المالك في قاعدة البيانات
        db.set(`bot_${Client.user.id}`, { ...Bot, botOwner: newOwnerId });

        // الرد على المستخدم
        Message.reply({ content: `**تم تحويل الاونر من <@${currentOwner}> الى <@${newOwnerId}>**` }).then(async (msg) => {
            await msg.edit({ 
                content: '', 
                embeds: [
                    new EmbedBuilder()
                        .setColor('Random') // استخدم لون عشوائي
                        .setThumbnail(newOwner.displayAvatarURL()) // وضع صورة العضو الجديد
                        .setTimestamp()
                        .setTitle('VIP Transfer')
                        .setDescription(`**تم تحويل الاونر الى <@${newOwnerId}>**`)
                ] 
            });
        }).catch((err) => {
            console.error(err);
        });
    }
};
