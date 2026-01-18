// File: commands/vip-addtoken.js  (أو وضعه مباشرة في مجلد الأوامر لديك)
// تعديل require ليشير إلى الملف في جذر المشروع
const { EmbedBuilder } = require('discord.js');
const { readBots, writeBots } = require('../botsFile'); // إذا ملف الأوامر داخل folder "commands"
// إذا كان vip-addtoken.js في نفس جذر المشروع، غيّر السطر أعلاه إلى:
// const { readBots, writeBots } = require('./botsFile');

module.exports = {
  name: 'add-tokens',
  cooldown: 10,

  execute: async (Client, Message) => {
    try {
      const allBots = await readBots();
      const botKey = `bot_${Client.user.id}`;
      const Bot = allBots[botKey] || {};

      if (!Bot.botOwner || Message.author.id !== Bot.botOwner) {
        return Message.reply({ content: `لست مالك البوت` });
      }

      const token = Message.content.split(' ').slice(1).join(' ').trim();
      if (!token) return Message.reply({ content: `**برجاء ادخال التوكن بعد الامر**` });

      // ensure structure
      allBots[botKey] = allBots[botKey] || {};
      allBots[botKey].tokens = allBots[botKey].tokens || [];

      // avoid exact-duplicate tokens
      const exists = allBots[botKey].tokens.some(t => t.token === token);
      if (exists) return Message.reply({ content: `**هذا التوكن محفوظ بالفعل**` });

      allBots[botKey].tokens.push({
        token,
        addedBy: Message.author.id,
        addedAt: new Date().toISOString(),
      });

      await writeBots(allBots);

      const embed = new EmbedBuilder()
        .setTitle('تم حفظ التوكن')
        .setDescription('**تم حفظ التوكن في bots.json بنجاح**')
        .setTimestamp();

      return Message.reply({ embeds: [embed] });
    } catch (err) {
      console.error('Error saving token to bots.json', err);
      return Message.reply({ content: `**حدث خطأ أثناء حفظ التوكن**` });
    }
  },
};
