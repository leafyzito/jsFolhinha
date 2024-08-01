const { manageCooldown } = require("../../utils/manageCooldown.js");
const { logAndReply } = require("../../utils/log.js");


const comandosCommand = async (client, message) => {
    message.command = 'comandos';
    if (!manageCooldown(5000, 'channel', message.senderUsername, message.command)) return;

    // TODO: getEmoteFromList
    logAndReply(client, message, `Para uma lista de comandos acesse https://folhinhabot.github.io/comandos`);
    return;
};


module.exports = {
    comandosCommand: comandosCommand,
    comandosAliases: ['comandos', 'commands', 'comando', 'command']
};
