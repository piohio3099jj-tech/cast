const { EmbedBuilder, Client, GatewayIntentBits } = require('discord.js');
const db = require('pro.db');
const mongoose = require('mongoose');

// === إعداد اتصال MongoDB ===
const MONGO_URI = 'mongodb+srv://piohio3099jj_db_user:rlSW7fNBmgBl8av9@cluster0.o2wkk0q.mongodb.net/Cluster0';

async function ensureMongoConnected() {
  if (mongoose.connection.readyState === 1) return; // already connected
  try {
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
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

// === المسموح لهم يستخدمون الأمر ===
const allowedUsers = [
  '1142808181626634261',
  '1438036495838609471'
];

module.exports = {
  data: {
    name: 'add-tokens',
    description: 'Adds tokens to MongoDB'
  },
  async execute(client, message, args) {
    // لفّ العملية كلها بـ try/catch عشان نقدر نعرض خطأ واضح
    try {
      // صلاحية
      if (!allowedUsers.includes(message.author.id)) {
        return message.reply({
          embeds: [new EmbedBuilder()
            .setDescription('**❌ ما عندك صلاحية تستخدم الأمر هذا**')
            .setColor(0xff0000)]
        });
      }

      // تأكد من اتصال Mongo
      try {
        await ensureMongoConnected();
      } catch (mongoErr) {
        console.error('Mongo ensure error:', mongoErr);
        return message.reply({
          embeds: [new EmbedBuilder()
            .setDescription('**⚠️ فشل اتصال قاعدة البيانات (MongoDB). شوف اللوق في السيرفر.**')
            .setColor(0xffa500)]
        });
      }

      const tokensRaw = args.join(' ');
      if (!tokensRaw) {
        return message.reply({
          embeds: [new EmbedBuilder()
            .setDescription('**❌ حط التوكنات**')
            .setColor(0xff0000)]
        });
      }

      // نقبل مسافات أو أسطر
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

      // جلب أو إنشاء سجل المستخدم (حسب ownerId = client.user.id)
      let userData = await TokenModel.findOne({ ownerId: client.user.id }).exec();
      if (!userData) {
        userData = new TokenModel({ ownerId: client.user.id, tokens: [] });
      }

      const existingTokens = Array.isArray(userData.tokens) ? userData.tokens : [];

      const quickReply = await message.reply({
        embeds: [new EmbedBuilder()
          .setDescription('**جاري فحص التوكنات...**')
          .setColor(0xffffff)]
      });

      // نفحص التوكنات واحدة واحدة
      for (const token of tokenArray) {
        // تجنّب تكرار واضح
        if (existingTokens.includes(token)) {
          duplicateTokens.push(token);
          continue;
        }

        try {
          // Client مؤقت للفحص — استخدم GatewayIntentBits
          const tempClient = new Client({ intents: [GatewayIntentBits.Guilds] });
          await tempClient.login(token);
          await tempClient.destroy();
          validTokens.push(token);
        } catch (loginErr) {
          // تسجيل الخطأ بالكونسول بدون كشف التوكن في الرسالة
          console.warn(`Token validation failed for one token (owner: ${message.author.id}). Reason: ${loginErr.message || loginErr}`);
          invalidTokens.push(token);
        }
      }

      // لو فيه توكنات صالحة نحفظها في Mongo
      if (validTokens.length > 0) {
        // دمج مع الموجود والتأكد من التفرد
        const combined = Array.from(new Set([...(userData.tokens || []), ...validTokens]));
        userData.tokens = combined;
        try {
          await userData.save();
          // (اختياري) حدّث pro.db أيضاً
          try { db.set(`tokens_${client.user.id}`, userData.tokens); } catch (e) { console.warn('pro.db set warning:', e); }
        } catch (saveErr) {
          console.error('Failed to save tokens to MongoDB:', saveErr);
          // نُعلم المستخدم مع الرجاء فحص اللوق
          return quickReply.edit({
            embeds: [new EmbedBuilder()
              .setDescription('**❌ تم التحقق من التوكنات لكن فشل حفظها في قاعدة البيانات. راجع لوق السيرفر.**')
              .setColor(0xff0000)]
          });
        }
      }

      const successMessage = validTokens.length
        ? `**✅ تم إضافة ${validTokens.length} توكن${validTokens.length === 1 ? '' : 'ات'} بنجاح**`
        : '';
      const errorMessage = invalidTokens.length
        ? `**❌ ${invalidTokens.length} توكن غير صالح**`
        : '';
      const duplicateMessage = duplicateTokens.length
        ? `**ℹ️ ${duplicateTokens.length} توكن مكرر**`
        : '';

      await quickReply.edit({
        embeds: [new EmbedBuilder()
          .setDescription([successMessage, errorMessage, duplicateMessage].filter(Boolean).join('\n') || '**ما تم إضافة شيء**')
          .setColor(validTokens.length ? 0x00ff00 : 0xff0000)]
      });

    } catch (err) {
      // خطأ غير متوقع: نطبع في الكونسول ونبلّغ المستخدم برسالة عامة مع جزء من الرسالة
      console.error('Unexpected error in add-tokens command:', err);
      const errMsg = err && err.message ? err.message : String(err);
      // لا نطبع أي بيانات حساسة (مثل التوكنات) في الرد للـ Discord
      return message.reply({
        embeds: [new EmbedBuilder()
          .setDescription(`**❌ صار خطأ أثناء تنفيذ الأمر.**\n\`\`\`${errMsg.slice(0, 200)}\`\`\``)
          .setColor(0xff0000)]
      });
    }
  }
};
