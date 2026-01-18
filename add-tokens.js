const { EmbedBuilder, Client } = require('discord.js');
const db = require('pro.db');
const mongoose = require('mongoose');

// اتصال MongoDB
mongoose.connect(
    'mongodb+srv://piohio3099jj_db_user:rlSW7fNBmgBl8av9@cluster0.o2wkk0q.mongodb.net/Cluster0',
    { useNewUrlParser: true, useUnifiedTopology: true }
).then(() => {
    console.log('MongoDB Connected');
}).catch(err => {
    console.error('MongoDB Connection Error:', err);
});

// Schema & Model
const tokenSchema = new mongoose.Schema({
    ownerId: { type: String, required: true },
    tokens: { type: [String], default: [] }
});

const TokenModel = mongoose.model('BotTokens', tokenSchema);

// المسموح لهم يستخدمون الأمر
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

        // صلاحية
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
                    .setDescription('**❌ حط التوكنات**')
                    .setColor(0xff0000)]
            });
        }

        // نقبل مسافات أو أسطر
        const tokenArray = tokensRaw.split(/\s+/).map(t => t.trim()).filter(Boolean);

        const validTokens = [];
        const invalidTokens = [];
        const duplicateTokens = [];

        // Mongo: جلب بيانات المستخدم
        let userData = await TokenModel.findOne({ ownerId: client.user.id });
        if (!userData) {
            userData = new TokenModel({ ownerId: client.user.id, tokens: [] });
        }

        const existingTokens = userData.tokens;

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
                const tempClient = new Client({ intents: ['Guilds'] });
                await tempClient.login(token);
                await tempClient.destroy();
                validTokens.push(token);
            } catch {
                invalidTokens.push(token);
            }
        }

        if (validTokens.length > 0) {
            userData.tokens.push(...validTokens);
            userData.tokens = [...new Set(userData.tokens)];
            await userData.save();

            // (اختياري) حفظ في pro.db لو تبيه
            db.set(`tokens_${client.user.id}`, userData.tokens);
        }

        const successMessage = validTokens.length
            ? `**تم إضافة ${validTokens.length} توكن بنجاح**`
            : '';
        const errorMessage = invalidTokens.length
            ? `**${invalidTokens.length} توكن غير صالح**`
            : '';
        const duplicateMessage = duplicateTokens.length
            ? `**${duplicateTokens.length} توكن مكرر**`
            : '';

        await quickReply.edit({
            embeds: [new EmbedBuilder()
                .setDescription([successMessage, errorMessage, duplicateMessage].filter(Boolean).join('\n') || '**ما تم إضافة شيء**')
                .setColor(validTokens.length ? 0x00ff00 : 0xff0000)]
        });
    },
};
