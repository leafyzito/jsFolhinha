const { processCommand } = require("../../utils/processCommand.js");

const comandosCommand = async (client, message) => {
    message.command = 'comandos';
    if (!await processCommand(5000, 'channel', message, client)) return;

    // TODO: getEmoteFromList
    client.log.logAndReply(message, `Para uma lista de comandos acesse https://folhinhabot.github.io/comandos`);
    return;
};

const helpCommand = async (client, message) => {
    message.command = 'help';
    if (!await processCommand(5000, 'channel', message, client)) return;

    client.log.logAndReply(message, `Para informações sobre o bot, acesse https://folhinhabot.github.io peepoHappy Se tiver qualquer dúvida, pode contactar o ${process.env.DEV_NICK}`);
};

comandosCommand.aliases = ['comandos', 'commands', 'comando', 'command'];
helpCommand.aliases = ['help', 'ajuda', 'info'];

module.exports = {
    comandosCommand,
    helpCommand,
};
