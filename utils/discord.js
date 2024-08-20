require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const { colorToHexString } = require('@kararty/dank-twitch-irc');

const allIntents = Object.values(GatewayIntentBits).reduce((acc, p) => acc | p, 0);
const discordClient = new Client({ intents: allIntents });
discordClient.EmbedBuilder = EmbedBuilder;

discordClient.login(process.env.DISCORD_TOKEN);

discordClient.on('ready', () => {
    console.log(`* Discord Client ${discordClient.user.tag} ready!`);
});


discordClient.logCommand = async function (message, response) {
    const embed = new discordClient.EmbedBuilder()
        .setTitle(`#${message.channelName}/${message.displayName} - ${message.command}`)
        .addFields(
            {
                name: "Comando:",
                value: message.messageText,
                inline: false
            },
            {
                name: "Resposta:",
                value: response,
                inline: false
            },
        )
        .setColor(message.color ? colorToHexString(message.color) : '#008000')
        .setFooter({
            text: `${message.responseTime}ms`,
        })
        .setTimestamp();

    const logChannel = await discordClient.channels.fetch(process.env.DISCORD_LOG_CHANNEL);
    logChannel.send({ embeds: [embed] });
}

discordClient.logSend = async function (channel, content) {
    const embed = new discordClient.EmbedBuilder()
        .setTitle(`Enviado para #${channel}`)
        .addFields(
            {
                name: "Conteúdo:",
                value: content,
                inline: false
            },
        )
        .setColor('#008000')
        .setTimestamp();

    const logChannel = await discordClient.channels.fetch(process.env.DISCORD_LOG_CHANNEL);
    logChannel.send({ embeds: [embed] });
}

discordClient.log = async function (content) {
    const logChannel = await discordClient.channels.fetch(process.env.DISCORD_LOG_CHANNEL);
    logChannel.send(content);
}

module.exports = { discordClient };