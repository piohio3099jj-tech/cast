const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: {
        name: 'help',
        description: 'Display information about available commands 📚',
    },
    async execute(client, message, args) {
        const quickReply = await message.reply({
            embeds: [
                new EmbedBuilder()
                    .setDescription('**`🚀 Processing your request...`**')
                    .setColor(0xffffff) 
            ]
        });

        const embed = new EmbedBuilder()
            .setAuthor({
                name: message.author.username,
                iconURL: message.author.displayAvatarURL()
            })
            .setColor('#ffffff') 
            .setTitle('🔧 **أوامر البث** 🔧') 
            .setDescription(`**✨ مرحبًا بك! إليك شرح الأزرار الموجودة بالأسفل:**\n\n` +
                `**🔑 Owner:** الأوامر الخاصة بصاحب البوت.\n` +
                `**🛠️ Admin:** الأوامر الخاصة بالمديرين.\n\n` +
                `📝 **اختر من الخيارات أدناه للحصول على المزيد من المعلومات!**`)
            .setFooter({
                text: `طلب بواسطة ${message.author.username}`,
                iconURL: message.author.displayAvatarURL()
            })
            .setThumbnail(message.author.displayAvatarURL())
            .setTimestamp(); 

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('Admin2')
                    .setLabel('🔧 Admin')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('Owner2')
                    .setLabel('🔑 Owner')
                    .setStyle(ButtonStyle.Primary),
            );

        await quickReply.edit({ embeds: [embed], components: [row] });

        const createCollector = () => {
            const filter = (interaction) => interaction.user.id === message.author.id;
            const collector = message.channel.createMessageComponentCollector({ filter, time: 15000 }); 

            collector.on('collect', async (interaction) => {
                await interaction.deferUpdate(); 

                if (interaction.customId === 'Admin2') {
                    const adminEmbed = new EmbedBuilder()
                        .setColor('#ffffff') 
                        .setTitle('✨ أوامر الإداريين ✨')
                        .setDescription('🔧 الأوامر المتاحة للإداريين:')
                        .addFields(
                            { name: '➕ **`add-tokens`**', value: '📝 إضافة توكنات إلى قاعدة البيانات', inline: true },
                            { name: '📤 **`obc`**', value: '📢 إرسال رسالة لكل من هم أونلاين في السيرفر', inline: true },
                            { name: '📤 **`bc`**', value: '📢 إرسال رسالة لكل الأعضاء في السيرفر', inline: true },
                            { name: '✅ **`check`**', value: '🔍 التحقق من حالة البوتات', inline: true },
                            { name: '🔢 **`count`**', value: '📊 عد الأعضاء في السيرفر', inline: true },
                            { name: '🗑️ **`delete`**', value: '🗄️ حذف توكنات من قاعدة البيانات', inline: true },
                            { name: '📜 **`list`**', value: '📋 عرض قائمة بالتوكينات الموجودة', inline: true },
                            { name: '🔗 **`links`**', value: '🔗 عرض روابط خاصة بالسيرفر', inline: true },
                            { name: '❓ **`help`**', value: '❓ عرض أوامر المساعدة', inline: true },
                            { name: '👋 **`leave`**', value: '🚪 جعل البوت يغادر السيرفر', inline: true }
                        )
                        .setFooter({ text: `طلب بواسطة ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
                        .setThumbnail(interaction.user.displayAvatarURL())
                        .setTimestamp();

                    await interaction.followUp({ embeds: [adminEmbed], ephemeral: true }); 

                } else if (interaction.customId === 'Owner2') {
                    const ownerEmbed = new EmbedBuilder()
                        .setColor('#ffffff') 
                        .setTitle('🌟 أوامر المالك 🌟')
                        .setDescription('🔑 الأوامر المتاحة للمالك:')
                        .addFields(
                            { name: '🖋️ **`vip-name`**', value: '✏️ تغيير اسم البوت', inline: true },
                            { name: '🖼️ **`vip-avatar`**', value: '🖼️ تغيير صورة البوت', inline: true },
                            { name: '🔠 **`vip-prefix`**', value: '🔧 تغيير برفكس البوت', inline: true },
                            { name: '🔄 **`vip-transfer`**', value: '🔁 نقل ملكية البوت', inline: true },
                            { name: '👤 **`profile`**', value: '🔄 تحديث الملفات الشخصية (الصورة والاسم) لكل البوتات', inline: true },
                            { name: '🏷️ **`name`**', value: '🏷️ إعادة تسمية البوتات بأسماء عشوائية من ملف', inline: true },
                            { name: '🖼️ **`avatar`**', value: '🖼️ تغيير صور البوتات', inline: true }
                        )
                        .setFooter({ text: `طلب بواسطة ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
                        .setThumbnail(interaction.user.displayAvatarURL())
                        .setTimestamp();

                    await interaction.followUp({ embeds: [ownerEmbed], ephemeral: true }); // استخدم followUp لتقديم الرد المناسب
                }

                collector.stop();
                createCollector(); 
            });

            collector.on('end', (collected) => {
                if (collected.size === 0) {
                    message.channel.send('⏳ انتهى وقت التفاعل!'); 
                }
            });
        };

        createCollector();
    }
};
