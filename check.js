const { Client, EmbedBuilder, GatewayIntentBits } = require('discord.js');
const db = require('pro.db');

module.exports = {
    data: {
        name: 'check',
        description: 'Check and validate tokens quickly and accurately',
    },
    async execute(client, message, args) {
        const Bot = db.get(`bot_${client.user.id}`) || {};
        if (!Bot.botOwner || Bot.botOwner !== message.author.id) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setDescription('**❌ You do not have permission to use this command**')
                        .setColor(0xff0000) 
                ]
            });
        }

        const tokens = db.get(`tokens_${client.user.id}`) || []; 

        if (tokens.length === 0) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setDescription('**❌ No tokens found to check**')
                        .setColor(0xff0000) 
                ]
            });
        }

        const quickReply = await message.reply({
            embeds: [
                new EmbedBuilder()
                    .setDescription('**🚀 Processing your request...**')
                    .setColor(0x00ff00) 
            ]
        });

        const validTokens = [];
        let validCount = 0;
        let removedCount = 0;

        const checkToken = async (token) => {
            let tempClient;
            try {
                tempClient = new Client({
                    intents: [
                        GatewayIntentBits.Guilds,
                        GatewayIntentBits.DirectMessages
                    ]
                });

                await tempClient.login(token);
                
                const isValid = await new Promise((resolve) => {
                    tempClient.once('ready', async () => {
                        console.log(`Token: ${token.slice(0, 10)}...${token.slice(-10)} - Valid`);
                        try {
                            const user = await tempClient.users.fetch(message.author.id);
                            if (user) {
                                const dmChannel = await user.createDM();
                                await dmChannel.send('Test message');
                                console.log(`Token: ${token.slice(0, 10)}...${token.slice(-10)} - Message sent successfully`);
                                resolve(true);
                            } else {
                                console.log(`Token: ${token.slice(0, 10)}...${token.slice(-10)} - User not found`);
                                resolve(false);
                            }
                        } catch (error) {
                            console.error(`Token: ${token.slice(0, 10)}...${token.slice(-10)} - Failed to send message: ${error.message}`);
                            resolve(false);
                        }
                    });

                    setTimeout(() => {
                        tempClient.destroy();
                        resolve(false);
                    }, 5000);
                });

                if (isValid) {
                    validTokens.push(token);
                    validCount++;
                } else {
                    removedCount++;
                }
            } catch (error) {
                removedCount++;
                console.error(`Token check failed: ${token.slice(0, 10)}...${token.slice(-10)} - ${error.message}`);
            } finally {
                if (tempClient) tempClient.destroy();
            }
        };

        const concurrencyLimit = 50;
        const tokenChunks = [];
        for (let i = 0; i < tokens.length; i += concurrencyLimit) {
            tokenChunks.push(tokens.slice(i, i + concurrencyLimit));
        }

        for (const chunk of tokenChunks) {
            await Promise.all(chunk.map(checkToken));
        }

        db.set(`tokens_${client.user.id}`, validTokens); 
        
        const resultEmbed = new EmbedBuilder()
            .setTitle('📝 Token Check Results')
            .setDescription(`
                **✅ Valid tokens: \`${validCount}\`**
                **❌ Removed tokens: \`${removedCount}\`**
                **📊 Total checked: \`${tokens.length}\`**
            `)
            .setColor(0xff0000) 
            .setTimestamp();


        await quickReply.edit({ embeds: [resultEmbed] });
    }
};
