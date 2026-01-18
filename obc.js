const { EmbedBuilder } = require('discord.js');
const db = require('pro.db');
const Eris = require('eris');

module.exports = {
    data: {
        name: 'obc',
        description: 'Send a message to all online members, distributed equally among available bots',
    },
    async execute(client, message, args) {
        const Bot = db.get(`bot_${client.user.id}`) || {};
        if (!Bot.botOwner || Bot.botOwner !== message.author.id) {
            return message.reply({
                embeds: [new EmbedBuilder()
                    .setDescription('❌ You do not have permission to use this command')
                    .setColor(0xff0000)]
            });
        }

        // استرجاع الرموز من قاعدة البيانات
        const tokens = db.get(`tokens_${client.user.id}`) || [];
        if (tokens.length === 0) {
            return message.reply({
                embeds: [new EmbedBuilder()
                    .setDescription('`❌ No bots found to send messages`')
                    .setColor(0xff0000)]
            });
        }

        const bots = tokens.map(token => new Eris(token));
        await Promise.all(bots.map(bot => bot.connect()));
        await new Promise(resolve => setTimeout(resolve, 1000)); // الانتظار حتى يتم تهيئة البوتات
        
        const botsNotInServer = bots.filter(bot => !bot.guilds.has(message.guild.id));
        
        if (botsNotInServer.length > 0) {
            await handleBotsNotInServer(botsNotInServer, message);
            return;
        }

        const broadcastMessage = args.join(' ');
        if (!broadcastMessage) {
            return message.reply({
                embeds: [new EmbedBuilder()
                    .setDescription('`❌ Please provide a message to broadcast`')
                    .setColor(0xff0000)]
            });
        }

        const members = await fetchEligibleMembers(message);
        if (members.size === 0) {
            return message.reply({
                embeds: [new EmbedBuilder()
                    .setDescription('`❌ No members found to send messages`')
                    .setColor(0xff0000)]
            });
        }

        const senders = createSenders(bots, members);
        const statusMessage = await message.channel.send({
            embeds: [new EmbedBuilder()
                .setDescription('`🚀 Starting broadcast...`')
                .setColor(0xffffff)] // Set to white
        });

        await broadcast(senders, broadcastMessage, statusMessage);
    }
};

async function handleBotsNotInServer(botsNotInServer, message) {
    const inviteLinks = botsNotInServer.map(bot => {
        if (bot && bot.user && bot.user.id) {
            return `**\`-\` <@${bot.user.id}> is not on this server:**\nhttps://discord.com/api/oauth2/authorize?client_id=${bot.user.id}&permissions=0&scope=bot`;
        }
        return '**`-` A bot is not properly initialized**';
    }).join('\n');

    if (inviteLinks.length > 2000) {
        const chunks = [];
        for (let i = 0; i < inviteLinks.length; i += 2000) {
            chunks.push(inviteLinks.slice(i, i + 2000));
        }
        for (const chunk of chunks) {
            await message.channel.send(chunk);
        }
    } else {
        await message.channel.send(inviteLinks);
    }
}

async function fetchEligibleMembers(message) {
    return (await message.guild.members.fetch()).filter(member => 
        !member.user.bot && 
        (member.presence?.status && member.presence.status !== 'offline')
    );
}

function createSenders(bots, members) {
    const chunkSize = Math.ceil(members.size / bots.length);
    return bots.map((bot, index) => ({
        client: bot,
        members: Array.from(members.values()).slice(index * chunkSize, (index + 1) * chunkSize),
        sent: 0,
        failed: 0
    }));
}

async function broadcast(senders, message, statusMessage) {
    const updateInterval = 1000; // 1 ثانية لتحسين السرعة
    let lastUpdate = Date.now();

    const sendPromises = senders.map(async (sender) => {
        for (const member of sender.members) {
            let messageSent = false;
            for (const bot of senders.map(s => s.client)) {
                try {
                    const dm = await bot.getDMChannel(member.id);
                    await dm.createMessage({ content: `** ${message} **\n<@${member.id}>\n` });
                    sender.sent++;
                    messageSent = true;
                    break;
                } catch (error) {   
                    // إذا فشل هذا البوت، سنحاول مع البوت التالي
                    continue;
                }
            }
            if (!messageSent) {
                sender.failed++;
            }

            const now = Date.now();
            if (now - lastUpdate >= updateInterval) {
                await updateStatus(senders, statusMessage);
                lastUpdate = now;
            }
        }
    });

    await Promise.all(sendPromises);
    await updateStatus(senders, statusMessage);
}

async function updateStatus(senders, statusMessage) {
    const status = senders.map(sender => 
        `**\`${sender.client.user.username}\`**: Sent **${sender.sent}**/**${sender.members.length}**`
    ).join('\n');
    
    const totalSent = senders.reduce((acc, sender) => acc + sender.sent, 0);
    const totalFailed = senders.reduce((acc, sender) => acc + sender.failed, 0);
    
    await statusMessage.edit({
        embeds: [new EmbedBuilder()
            .setDescription(`**📊 Broadcast Progress:**\n${status}\n\n**Total Sent: \`${totalSent}\`**, **Total Failed: \`${totalFailed}\`**`)
            .setColor(0xffffff)] // Set to white
    });
}
