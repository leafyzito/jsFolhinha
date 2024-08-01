const { manageCooldown } = require("../../utils/manageCooldown.js");

const testeCommand = async (client, message) => {
    message.command = 'teste';
    if (!manageCooldown(5000, 'channel', message.senderUsername, message.command)) return;

    const invoked_by = message.messageText.split(" ", 1)[0].slice(message.commandPrefix.length).toLowerCase();
    console.log(invoked_by);

    client.log.logAndReply(message, 'testado 4');
    return;
};


module.exports = {
    testeCommand,
    testeAliases: ['teste', 'test', 'testing']
};
