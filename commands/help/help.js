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

    const dayBeforeCommandsCount = await client.db.get('commandlog', { 'sentDate': { '$gt': oneDayFormattedDate } });
    const hourBeforeCommandsCount = await client.db.get('commandlog', { 'sentDate': { '$gt': oneHourFormattedDate } });

    client.log.logAndReply(message, `Comandos nas últimas 24h/1h: ${dayBeforeCommandsCount.length}/${hourBeforeCommandsCount.length} - https://shlink.mrchuw.com.br/jErVU`);

}

comandosCommand.commandName = 'comandos';
comandosCommand.aliases = ['comandos', 'commands', 'comando', 'command'];
comandosCommand.shortDescription = 'Mostra um link para uma lista de comandos do bot';
comandosCommand.cooldown = 5000;
comandosCommand.whisperable = true;
comandosCommand.description = 'Uso: !comandos; Resposta esperada: Para uma lista de comandos acesse {link}';
comandosCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/help/help.js`;

helpCommand.commandName = 'help';
helpCommand.aliases = ['help', 'ajuda', 'info'];
helpCommand.shortDescription = 'Mostra um link para o site do bot';
helpCommand.cooldown = 5000;
helpCommand.whisperable = true;
helpCommand.description = 'Uso: !help; Resposta esperada: Para informações sobre o bot, acesse {link}';
helpCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/help/help.js`;

statsCommand.commandName = 'stats';
statsCommand.aliases = ['stats', 'ping', 'uptime'];
statsCommand.shortDescription = 'Mostra algumas informações sobre o bot';
statsCommand.cooldown = 5000;
statsCommand.whisperable = true;
statsCommand.description = 'Uso: !stats; Resposta esperada: Uptime: {uptime} | Canais {canais} | Memória: {memória utilizada}';
statsCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/help/help.js`;

botStatsCommand.commandName = 'botstats';
botStatsCommand.aliases = ['botstats', 'bstats'];
botStatsCommand.shortDescription = 'Mostra algumas informações extra sobre o bot';
botStatsCommand.cooldown = 5000;
botStatsCommand.whisperable = true;
botStatsCommand.description = 'Uso: !botstats; Resposta esperada: Comandos nas últimas 24h/1h: {comandos nas últimas 24h}/{comandos nas últimas 1h} {link para estatísticas do bot}';
botStatsCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/help/help.js`;

module.exports = {
    comandosCommand,
    helpCommand,
    statsCommand,
    botStatsCommand
};
