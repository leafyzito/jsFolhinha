const { manageCooldown } = require("../../utils/manageCooldown.js");
const { logAndReply, logAndMeAction } = require("../../utils/log.js");

const meCommand = async (client, message) => {
    message.command = 'me';
    if (!manageCooldown(5000, 'channel', message.senderUsername, message.command)) return;

    if (message.messageText.split(' ').length < 2) {
        logAndReply(client, message, `Use o formato: ${message.commandPrefix}me <mensagem>`);
        return;
    }

    const msgContent = message.messageText.split(' ').slice(1).join(' ');
    logAndMeAction(client, message, msgContent);
};


module.exports = {
    meCommand: meCommand,
    meAliases: ['me']
};
