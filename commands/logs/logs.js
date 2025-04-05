const { processCommand } = require("../../utils/processCommand.js");

const getLogsLink = async (channelName, userName) => {
    const url = `https://tv.supa.sh/logs?c=${channelName}&u=${userName}`;
    return url;
};

const logsCommand = async (client, message) => {
    message.command = 'logs';
    if (!await processCommand(5000, 'channel', message, client)) return;

    const messageParts = message.messageText.split(' ');
    const targetChannel = messageParts.length === 2 ? message.channelName : messageParts[1]?.replace(/^@/, '') || message.channelName;
    const targetUser = messageParts.length === 2 ? messageParts[1]?.replace(/^@/, '') : messageParts[2]?.replace(/^@/, '') || message.senderUsername;
    const logsLink = await getLogsLink(targetChannel, targetUser);

    client.log.logAndReply(message, `Logs: ${logsLink}`);
    return;
};

logsCommand.commandName = 'logs';
logsCommand.aliases = ['logs', 'log', 'logs'];
logsCommand.shortDescription = 'Veja os logs do chat';
logsCommand.cooldown = 5000;
logsCommand.whisperable = false;
logsCommand.description = `Obtenha um link para os logs de chat de um determinado par de canal e usuário. Usa a API best-logs do @ZonianMidian para pesquisar todas as instâncias conhecidas e o frontend do @Supelle para visualização dos logs.`;
logsCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/${logsCommand.commandName}/${logsCommand.commandName}.js`;

module.exports = {
    logsCommand,
};
