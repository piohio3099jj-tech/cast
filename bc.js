
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const db = require('pro.db');
const Eris = require('eris');

const SKIP_ROLE_1 = '';
const SKIP_ROLE_2 = '';
const UPDATE_INTERVAL = 1000; 
const MAX_CONCURRENT_SENDS = 5; 

module.exports = {
    data: {
        name: 'bc',
        description: 'Send a message to all members, distributed equally among available bots',
    },
    execute: async (client, message, args) => {
        if (!message.member.permissions.has('Administrator')) {
            return message.reply({ embeds: [new EmbedBuilder()
                .setDescription('**`❌ You do not have permission to use this command`**')
                .setColor(0xff0000)] 
            });
        }

        const tokens = db.get(`tokens_${client.user.id}`) || []; 
        if (tokens.length === 0) {
            return message.reply({ embeds: [new EmbedBuilder()
                .setDescription('**`❌ No bots found to send messages`**')
                .setColor(0xff0000)] 
            });
        }

        const bots = tokens.map(token => new Eris(token));
        await Promise.all(bots.map(bot => bot.connect()));
        await new Promise(resolve => setTimeout(resolve, 1000)); 
        
        const botsNotInServer = bots.filter(bot => !bot.guilds.has(message.guild.id));
        
        if (botsNotInServer.length > 0) {
            await handleBotsNotInServer(botsNotInServer, message);
            return;
        }

        const broadcastMessage = args.join(' ');
        if (!broadcastMessage) {
            return message.reply({ embeds: [new EmbedBuilder()
                .setDescription('**`❌ Please provide a message to broadcast`**')
                .setColor(0xff0000)] 
            });
        }

        const members = await fetchEligibleMembers(message);
        if (members.size === 0) {
            return message.reply({ embeds: [new EmbedBuilder()
                .setDescription('**`❌ No members found to send messages`**')
                .setColor(0xff0000)] 
            });
        }

        const senders = createSenders(bots, members);
        const statusMessage = await message.channel.send({ embeds: [new EmbedBuilder()
            .setDescription('**`🚀 Starting broadcast...`**')
            .setColor(0x00ff00)] 
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
        !member.roles.cache.has(SKIP_ROLE_1) && 
        !member.roles.cache.has(SKIP_ROLE_2)
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
    let lastUpdate = Date.now();
    let totalSent = 0;
    let totalFailed = 0;

    const sendPromises = [];
    for (const sender of senders) {
        const memberPromises = sender.members.map(async (member) => {
            try {
                const dm = await sender.client.getDMChannel(member.id);
                await dm.createMessage({ content: `** ${message} **\n<@${member.id}>\n` });
                sender.sent++;
                totalSent++;
            } catch (error) {
                sender.failed++;
                totalFailed++;
            }
        });

        for (let i = 0; i < memberPromises.length; i += MAX_CONCURRENT_SENDS) {
            await Promise.all(memberPromises.slice(i, i + MAX_CONCURRENT_SENDS));
        }

        const now = Date.now();
        if (now - lastUpdate >= UPDATE_INTERVAL) {
            await updateStatus(senders, statusMessage, totalSent, totalFailed);
            lastUpdate = now;
        }
    }

    await updateStatus(senders, statusMessage, totalSent, totalFailed);
}

async function updateStatus(senders, statusMessage, totalSent, totalFailed) {
    const status = senders.map(sender => 
        `**\`${sender.client.user.username}\`**: Sent **${sender.sent}**/**${sender.members.length}**`
    ).join('\n');
    
    await statusMessage.edit({ embeds: [new EmbedBuilder()
        .setDescription(`**📊 Broadcast Progress:**\n${status}\n\n**Total Sent: \`${totalSent}\`**, **Total Failed: \`${totalFailed}\`**`)
        .setColor(0x00ff00)] 
    });
}
