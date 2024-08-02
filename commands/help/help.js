const { manageCooldown } = require("../../utils/manageCooldown.js");

const comandosCommand = async (client, message) => {
    message.command = 'comandos';
    if (!manageCooldown(5000, 'channel', message.senderUsername, message.command)) return;

    // TODO: getEmoteFromList
    client.log.logAndReply(message, `Para uma lista de comandos acesse https://folhinhabot.github.io/comandos`);
    return;
};

const helpCommand = async (client, message) => {
    message.command = 'help';
    if (!manageCooldown(5000, 'channel', message.senderUsername, message.command)) return;

    client.log.logAndReply(message, `Para informações sobre o bot, acesse https://folhinhabot.github.io peepoHappy Se tiver qualquer dúvida, pode contactar o ${process.env.DEV_NICK}`);
};


module.exports = {
    comandosCommand: comandosCommand,
    comandosAliases: ['comandos', 'commands', 'comando', 'command'],
    helpCommand: helpCommand,
    helpAliases: ['help', 'ajuda', 'info'],
};
