const { processCommand } = require("../../utils/processCommand.js");

const testeCommand = async (client, message) => {
    message.command = 'teste';
    if (!await processCommand(5000, 'channel', message, client)) return;

    const invoked_by = message.messageText.split(" ", 1)[0].slice(message.commandPrefix.length).toLowerCase();
    console.log(invoked_by);

    client.log.logAndReply(message, 'testado 3444');
    return;
};

testeCommand.aliases = ['teste', 'test', 'testing'];

module.exports = {
    testeCommand,
};
