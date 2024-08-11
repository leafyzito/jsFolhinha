const { processCommand } = require("../../utils/processCommand.js");
const { timeSince } = require("../../utils/utils.js");

const comandosCommand = async (client, message) => {
    message.command = 'comandos';
    if (!await processCommand(5000, 'channel', message, client)) return;

    client.log.logAndReply(message, `Para uma lista de comandos acesse https://folhinhabot.github.io/comandos`);
    return;
};

const helpCommand = async (client, message) => {
    message.command = 'help';
    if (!await processCommand(5000, 'channel', message, client)) return;

    const emote = await client.emotes.getEmoteFromList(message.channelName, client.emotes.happyEmotes, 'peepoHappy');
    client.log.logAndReply(message, `Para informações sobre o bot, acesse https://folhinhabot.github.io ${emote} Se tiver qualquer dúvida, pode contactar o @${process.env.DEV_NICK}`);
};

const statsCommand = async (client, message) => {
    message.command = 'stats';
    if (!await processCommand(5000, 'channel', message, client)) return;

    const uptime = timeSince(client.startTime);
    const channelsCount = [...client.joinedChannels].length;
    const usedRam = process.memoryUsage().heapUsed / 1024 / 1024;

    client.log.logAndReply(message, `Uptime: ${uptime} | Canais: ${channelsCount} | RAM: ${Math.round(usedRam * 100) / 100}mb`);
}

const botStatsCommand = async (client, message) => {
    message.command = 'botstats';
    if (!await processCommand(5000, 'channel', message, client)) return;

    const currentDate = new Date();
    const oneDayBefore = new Date(currentDate.getTime() - (24 * 60 * 60 * 1000));
    const oneDayFormattedDate = oneDayBefore.toISOString().slice(0, 19).replace("T", " ");
    const oneHourBefore = new Date(currentDate.getTime() - (60 * 60 * 1000));
    const oneHourFormattedDate = oneHourBefore.toISOString().slice(0, 19).replace("T", " ");
    
    const dayBeforeCommandsCount = await client.db.get('commandlog', {'sentDate': {'$gt': oneDayFormattedDate}});
    const hourBeforeCommandsCount = await client.db.get('commandlog', {'sentDate': {'$gt': oneHourFormattedDate}});

    client.log.logAndReply(message, `Comandos nas últimas 24h/1h: ${dayBeforeCommandsCount.length}/${hourBeforeCommandsCount.length} - https://shlink.mrchuw.com.br/jErVU`);

}

comandosCommand.aliases = ['comandos', 'commands', 'comando', 'command'];
helpCommand.aliases = ['help', 'ajuda', 'info'];
statsCommand.aliases = ['stats', 'ping', 'uptime'];
botStatsCommand.aliases = ['botstats', 'bstats'];

module.exports = {
    comandosCommand,
    helpCommand,
    statsCommand,
    botStatsCommand
};
