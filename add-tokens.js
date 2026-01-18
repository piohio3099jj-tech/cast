// File: utils/botsFile.js
const fs = require('fs').promises;
const path = require('path');

const botsFilePath = path.join(__dirname, '..', 'bots.json');

async function readBots() {
  try {
    const data = await fs.readFile(botsFilePath, 'utf8');
    if (!data) return {};
    return JSON.parse(data);
  } catch (err) {
    if (err.code === 'ENOENT') return {};
    throw err;
  }
}

async function writeBots(obj) {
  const tmpPath = botsFilePath + '.tmp';
  const str = JSON.stringify(obj, null, 2);
  // write to a temp file first, then rename for safer writes
  await fs.writeFile(tmpPath, str, 'utf8');
  await fs.rename(tmpPath, botsFilePath);
}

module.exports = {
  readBots,
  writeBots,
  botsFilePath,
};


// ------------------------------------------------------------
// File: commands/vip-addtoken.js
const { EmbedBuilder } = require('discord.js');
const { readBots, writeBots } = require('../utils/botsFile');

module.exports = {
  name: 'vip-addtoken',
  cooldown: 10,

  execute: async (Client, Message) => {
    // check ownership using existing stored bot info if present
    const allBots = await readBots();
    const botKey = `bot_${Client.user.id}`;
    const Bot = allBots[botKey] || {};

    if (!Bot.botOwner || Message.author.id !== Bot.botOwner) {
      return Message.reply({ content: `لست مالك البوت` });
    }

    const token = Message.content.split(' ').slice(1).join(' ').trim();
    if (!token) return Message.reply({ content: `**برجاء ادخال التوكن بعد الامر**` });

    try {
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


// ------------------------------------------------------------
// Usage notes (not a file):
// - Put utils/botsFile.js in a folder named `utils` (relative to your project root).
// - Put vip-addtoken.js in your commands folder (same place as vip-name.js).
// - Use the command in Discord like: `!vip-addtoken <TOKEN>` (or whatever your prefix is).
// - The tokens are stored in bots.json as a JSON object keyed by `bot_<BOT_ID>`.
//   Example structure:
//   {
//     "bot_123456789012345678": {
//       "botOwner": "OWNER_ID",
//       "tokens": [ {"token": "abc.def.ghi", "addedBy": "OWNER_ID", "addedAt": "2026-01-18T...Z"} ]
//     }
//   }
// - The code will create bots.json if it doesn't exist and won't duplicate exact-token entries.
