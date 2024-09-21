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

function getFormattedDateTime() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return `${day}/${month}/${year} - ${hours}:${minutes}:${seconds}`;
}


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
            text: `${message.responseTime}ms • ${getFormattedDateTime()}`,
        })

    const logChannel = await discordClient.channels.fetch(process.env.DISCORD_LOG_CHANNEL);
    logChannel.send({ embeds: [embed] })
        .catch((err) => {
            console.error(`Erro ao enviar mensagem no discord logCommand: ${err}`);
        });
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
        .setFooter({
            text: `${getFormattedDateTime()}`,
        });

    const logChannel = await discordClient.channels.fetch(process.env.DISCORD_LOG_CHANNEL);
    logChannel.send({ embeds: [embed] })
        .catch((err) => {
            console.error(`Erro ao enviar mensagem no discord logSend: ${err}`);
        });
}

discordClient.log = async function (content) {
    const logChannel = await discordClient.channels.fetch(process.env.DISCORD_LOG_CHANNEL);
    logChannel.send(content)
        .catch((err) => {
            console.error(`Erro ao enviar mensagem no discord log: ${err}`);
        });
}

discordClient.logWhisper = async function (recipient, content) {
    const embed = new discordClient.EmbedBuilder()
        .setTitle(`Whisper para #${recipient}`)
        .addFields(
            {
                name: "Conteúdo:",
                value: content,
                inline: false
            },
        )
        .setColor('#008000')
        .setFooter({
            text: `${getFormattedDateTime()}`,
        });

    const logChannel = await discordClient.channels.fetch(process.env.DISCORD_LOG_CHANNEL);
    logChannel.send({ embeds: [embed] })
        .catch((err) => {
            console.error(`Erro ao enviar mensagem no discord logWhisper: ${err}`);
        });
}

module.exports = { discordClient };