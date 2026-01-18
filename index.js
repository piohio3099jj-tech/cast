require('dotenv').config();
const { Client, Partials, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const path = require('path');
const fs = require('fs');
const db = require('pro.db');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.DirectMessageReactions,
        GatewayIntentBits.DirectMessageTyping,
    ],
    partials: [Partials.Channel, Partials.GuildMember, Partials.Message, Partials.Reaction, Partials.User]
});

client.on('ready', () => {
    console.log(`Username: ${client.user.username}`);
    console.log(`ID: ${client.user.id}`);
    console.log(`Bot: ${client.user.bot}`);

    const botData = db.get(`bot_${client.user.id}`) || {};
    if (!botData.botOwner) {
        botData.botOwner = '1142808181626634261';
        botData.botPrefix = botData.botPrefix || '-';
        db.set(`bot_${client.user.id}`, botData);
        console.log(`✅ Bot owner set to: ${botData.botOwner}`);
        console.log(`✅ Bot prefix set to: ${botData.botPrefix}`);
    } else {
        console.log(`✅ Bot owner: ${botData.botOwner}`);
        console.log(`✅ Bot prefix: ${botData.botPrefix || '-'}`);
    }
});

// تحميل جميع أوامر JS الموجودة مباشرة في المجلد الحالي
const commandsPath = __dirname; // هنا المجلد الرئيسي
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js') && file !== path.basename(__filename));

client.commands = new Map();

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);

    if (('data' in command && 'execute' in command) || ('name' in command && 'execute' in command)) {
        const cmdName = command.data?.name || command.name;
        client.commands.set(cmdName, command);
    } else {
        console.log(`[WARNING] Command at ${filePath} is missing required properties.`);
    }
}

client.on('messageCreate', async (message) => {
    const botData = db.get(`bot_${client.user.id}`) || {};
    if (!botData || !botData.botOwner) return;

    const prefix = botData.botPrefix || '-';
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = client.commands.get(commandName);
    if (!command) return;

    try {
        await command.execute(client, message, args);
    } catch (error) {
        console.error(error);
        message.reply('There was an error trying to execute that command!');
    }
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    // كل الأوامر موجودة في المجلد الرئيسي
    const commandFiles = fs.readdirSync(__dirname).filter(file => file.endsWith('.js') && file !== path.basename(__filename));
    const Embed = new EmbedBuilder()
        .setColor('Random')
        .setDescription(`**${commandFiles.map(file => `\`${file.replace('.js', '')}\``).join('\n')}**`)
        .setFooter({ text: interaction.user.username, iconURL: interaction.user.displayAvatarURL() })
        .setThumbnail(interaction.user.displayAvatarURL())
        .setTimestamp()
        .setTitle(`Commands`);

    interaction.reply({ embeds: [Embed], ephemeral: true });
});

// تسجيل الدخول
client.login(process.env.TOKEN);


