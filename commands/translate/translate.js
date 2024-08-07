const { processCommand } = require("../../utils/processCommand.js");

const translateCommand = async (client, message) => {
    message.command = 'translate';
    if (!await processCommand(5000, 'channel', message, client)) return;

    client.log.logAndReply(message, `Ainda não foi feito para o Folhinha 3.0, cobrem o @${process.env.DEV_NICK} FeelsOkayMan`);
    return;
};

translateCommand.aliases = ['translate', 'traduzir'];

module.exports = {
    translateCommand,
};
