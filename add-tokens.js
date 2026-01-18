const { EmbedBuilder, Client, GatewayIntentBits } = require('discord.js');
const db = require('pro.db');
const mongoose = require('mongoose');

// === إعداد اتصال MongoDB ===
const MONGO_URI = 'mongodb+srv://piohio3099jj_db_user:rlSW7fNBmgBl8av9@cluster0.o2wkk0q.mongodb.net/Cluster0?retryWrites=true&w=majority';

// (اختياري) منع تحذيرات strictQuery
mongoose.set('strictQuery', false);

async function ensureMongoConnected() {
  if (mongoose.connection.readyState === 1) return; // already connected
  try {
    // ملاحظة: لا نمرّر الخيارات deprecated هنا
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB Connected');
  } catch (err) {
    console.error('MongoDB Connection Error:', err);
    throw err;
  }
}

// === Schema & Model ===
const tokenSchema = new mongoose.Schema({
  ownerId: { type: String, required: true, unique: true },
  tokens: { type: [String], default: [] }
});
const TokenModel = mongoose.models.BotTokens || mongoose.model('BotTokens', tokenSchema);

// بقية الكود كما كان... (الأمر add-tokens)
module.exports = {
  data: {
    name: 'add-tokens',
    description: 'Adds tokens to MongoDB'
  },
  async execute(client, message, args) {
    try {
      // صلاحية
      const allowedUsers = [
        '1142808181626634261',
        '1438036495838609471'
      ];
      if (!allowedUsers.includes(message.author.id)) {
        return message.reply({
          embeds: [new EmbedBuilder()
            .setDescription('**❌ ما عندك صلاحية تستخدم الأمر هذا**')
            .setColor(0xff0000)]
        });
      }

      await ensureMongoConnected();

      const tokensRaw = args.join(' ');
      if (!tokensRaw) {
        return message.reply({
          embeds: [new EmbedBuilder()
            .setDescription('**❌ حط التوكنات**')
            .setColor(0xff0000)]
        });
      }

      const tokenArray = tokensRaw.split(/\s+/).map(t => t.trim()).filter(Boolean);
      if (tokenArray.length === 0) {
        return message.reply({
          embeds: [new EmbedBuilder()
            .setDescription('**❌ ما في توكن صالح داخل المدخلات**')
            .setColor(0xff0000)]
        });
      }

      const validTokens = [];
      const invalidTokens = [];
      const duplicateTokens = [];

      let userData = await TokenModel.findOne({ ownerId: client.user.id }).exec();
      if (!userData) userData = new TokenModel({ ownerId: client.user.id, tokens: [] });
      const existingTokens = Array.isArray(userData.tokens) ? userData.tokens : [];

      const quickReply = await message.reply({
        embeds: [new EmbedBuilder()
          .setDescription('**جاري فحص التوكنات...**')
          .setColor(0xffffff)]
      });

      for (const token of tokenArray) {
        if (existingTokens.includes(token)) {
          duplicateTokens.push(token);
          continue;
        }

        try {
          const tempClient = new Client({ intents: [GatewayIntentBits.Guilds] });
          await tempClient.login(token);
          await tempClient.destroy();
          validTokens.push(token);
        } catch (loginErr) {
          console.warn('Token validation failed:', loginErr && loginErr.message ? loginErr.message : loginErr);
          invalidTokens.push(token);
        }
      }

      if (validTokens.length > 0) {
        userData.tokens = Array.from(new Set([...(userData.tokens || []), ...validTokens]));
        await userData.save();
        try { db.set(`tokens_${client.user.id}`, userData.tokens); } catch(e){ console.warn('pro.db set warning:', e); }
      }

      const successMessage = validTokens.length ? `**✅ تم إضافة ${validTokens.length} توكن${validTokens.length === 1 ? '' : 'ات'} بنجاح**` : '';
      const errorMessage = invalidTokens.length ? `**❌ ${invalidTokens.length} توكن غير صالح**` : '';
      const duplicateMessage = duplicateTokens.length ? `**ℹ️ ${duplicateTokens.length} توكن مكرر**` : '';

      await quickReply.edit({
        embeds: [new EmbedBuilder()
          .setDescription([successMessage, errorMessage, duplicateMessage].filter(Boolean).join('\n') || '**ما تم إضافة شيء**')
          .setColor(validTokens.length ? 0x00ff00 : 0xff0000)]
      });

    } catch (err) {
      console.error('Unexpected error in add-tokens command:', err);
      const errMsg = err && err.message ? err.message : String(err);
      return message.reply({
        embeds: [new EmbedBuilder()
          .setDescription(`**❌ صار خطأ أثناء تنفيذ الأمر.**\n\`\`\`${errMsg.slice(0, 200)}\`\`\``)
          .setColor(0xff0000)]
      });
    }
  }
};
