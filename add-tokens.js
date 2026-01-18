const { EmbedBuilder, Client } = require('discord.js');
const db = require('pro.db');
const fs = require('fs');
const path = require('path');

// مسارات محاولة الحفظ: بدايةً جذر التشغيل، وإذا فشل نجرب مجلد الملف الحالي
const botsFilePathCandidates = [
  path.join(process.cwd(), 'bots.json'),
  path.join(__dirname, '..', 'bots.json'),
  path.join(__dirname, 'bots.json')
];

// المسموح لهم يستخدمون الأمر فقط
const allowedUsers = [
  '1142808181626634261',
  '1438036495838609471'
];

function chooseWritablePath(candidates) {
  for (const p of candidates) {
    try {
      // إذا الملف موجود وجافا سكربت تقدر تقرأه/تكتبه -> نستخدمه
      if (fs.existsSync(p)) {
        // نجرب كتابة مؤقتة (لنفس الملف) عن طريق فتح/إغلاق فقط للتأكد من الصلاحية
        fs.accessSync(p, fs.constants.R_OK | fs.constants.W_OK);
        return p;
      } else {
        // الملف غير موجود — نجرب إنشاء ملف فارغ إذا كانت المجلدات موجودة
        const dir = path.dirname(p);
        if (!fs.existsSync(dir)) continue;
        // نجرب إنشاء و حذف مؤقت للتأكد من صلاحية الكتابة بالمجلد
        const testPath = path.join(dir, `.tmp_write_test_${Date.now()}`);
        fs.writeFileSync(testPath, 'test', 'utf8');
        fs.unlinkSync(testPath);
        return p;
      }
    } catch (err) {
      // مسار ما ينفع، نجرب التالي
      continue;
    }
  }
  return null;
}

module.exports = {
  data: {
    name: 'add-tokens',
    description: 'Adds tokens to the database'
  },
  async execute(client, message, args) {
    // صلاحية الاستخدام
    if (!allowedUsers.includes(message.author.id)) {
      return message.reply({
        embeds: [new EmbedBuilder()
          .setDescription('**❌ ما عندك صلاحية تستخدم الأمر هذا**')
          .setColor(0xff0000)]
      });
    }

    const tokensRaw = args.join(' ');
    if (!tokensRaw) {
      return message.reply({
        embeds: [new EmbedBuilder()
          .setDescription('**❌ الرجاء إدخال التوكنات**')
          .setColor(0xff0000)]
      });
    }

    // نقبل توكن مفصول بسطر أو بمسافة أو بمسافات متعددة
    const tokenArray = tokensRaw.split(/\s+/).map(t => t.trim()).filter(Boolean);

    const validTokens = [];
    const invalidTokens = [];
    const duplicateTokens = [];

    const existingTokens = db.get(`tokens_${client.user.id}`) || [];

    const quickReply = await message.reply({
      embeds: [new EmbedBuilder()
        .setDescription('**🚀 جاري معالجة طلبك...**')
        .setColor(0xffffff)]
    });

    for (const token of tokenArray) {
      if (existingTokens.includes(token)) {
        duplicateTokens.push(token);
        continue;
      }

      try {
        const tempClient = new Client({ intents: ['Guilds'] });
        await tempClient.login(token);
        await tempClient.destroy();
        validTokens.push(token);
      } catch (error) {
        invalidTokens.push(token);
      }
    }

    let writeError = null;
    if (validTokens.length > 0) {
      // Update pro.db
      try {
        db.set(`tokens_${client.user.id}`, [...existingTokens, ...validTokens]);
      } catch (err) {
        // لو DB فشل، نحتفظ بالخطأ لكن نحاول الكتابة للملف بعد
        console.error('pro.db set error:', err);
      }

      // Also save/update bots.json
      const chosenPath = chooseWritablePath(botsFilePathCandidates);
      if (!chosenPath) {
        writeError = 'No writable path found for bots.json (check permissions and folders).';
      } else {
        try {
          let botsData = {};
          if (fs.existsSync(chosenPath)) {
            const raw = fs.readFileSync(chosenPath, 'utf8');
            botsData = raw ? JSON.parse(raw) : {};
          }

          // نضمن وجود مصفوفة للـ client id
          const fileExisting = Array.isArray(botsData[client.user.id]) ? botsData[client.user.id] : [];
          const combined = Array.from(new Set([...fileExisting, ...existingTokens, ...validTokens]));

          botsData[client.user.id] = combined;

          fs.writeFileSync(chosenPath, JSON.stringify(botsData, null, 2), 'utf8');
        } catch (err) {
          console.error('Failed to write bots.json:', err);
          writeError = err.message || String(err);
        }
      }
    }

    const successMessage = validTokens.length > 0 ? `**✅ ${validTokens.length} توكن${validTokens.length === 1 ? '' : 'ات'} تمت إضافتها بنجاح**` : '';
    const errorMessage = invalidTokens.length > 0 ? `**❌ ${invalidTokens.length} توكن${invalidTokens.length === 1 ? '' : 'ات'} غير صالحة ولم تُضاف**` : '';
    const duplicateMessage = duplicateTokens.length > 0 ? `**ℹ️ ${duplicateTokens.length} توكن${duplicateTokens.length === 1 ? '' : 'ات'} كانت موجودة بالفعل**` : '';
    const fileMessage = writeError ? `**⚠️ خطأ بحفظ bots.json:** ${writeError}` : (validTokens.length > 0 ? '**💾 bots.json تم تحديثه بنجاح (إن وُجد مسار للكتابة).**' : '');

    const responseMessage = [successMessage, errorMessage, duplicateMessage, fileMessage].filter(Boolean).join('\n');

    await quickReply.edit({
      embeds: [new EmbedBuilder()
        .setDescription(responseMessage || '**ℹ️ لم تتم إضافة أي توكنات**')
        .setColor(validTokens.length > 0 && !writeError ? 0x00ff00 : 0xff0000)]
    });
  },
};
