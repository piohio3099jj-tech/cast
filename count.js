const { EmbedBuilder } = require('discord.js');
const db = require('pro.db');

module.exports = {
    data: {
        name: 'count',
        description: 'Count the number of tokens',
    },
    async execute(client, message, args) {
        const quickReply = await message.reply({
            embeds: [
                new EmbedBuilder()
                    .setDescription('**`🚀 Processing your request...`**')
                    .setColor(0xffffff) 
            ]
        });

        if (!message.member.permissions.has('Administrator')) {
            return quickReply.edit({
                embeds: [
                    new EmbedBuilder()
                        .setDescription('\`❌ You do not have permission to use this command\`')
                        .setColor(0xff0000) 
                ]
            });
        }

        const tokens = db.get(`tokens_${client.user.id}`) || []; 

        await quickReply.edit({
            embeds: [
                new EmbedBuilder()
                    .setDescription(`\`✅ **${tokens.length}** tokens found\``)
                    .setColor(0xffffff) 
            ]
        });
    },
};
