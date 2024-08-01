const { manageCooldown } = require("../../utils/manageCooldown.js");
const { logAndReply } = require("../../utils/log.js");


const escolhaCommand = async (client, message) => {
    message.command = 'escolha';
    if (!manageCooldown(5000, 'channel', message.senderUsername, message.command)) return;

    const invoked_by = message.messageText.split(" ", 1)[0].slice(message.commandPrefix.length).toLowerCase();
    console.log(invoked_by);

    logAndReply(client, message, 'testado 3');

    return;
};


module.exports = { escolhaCommand: escolhaCommand};
