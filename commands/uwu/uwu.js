const Uwuifier = require("uwuifier").default;
const { processCommand } = require("../../utils/processCommand.js");

const uwuifier = new Uwuifier();

const uwuCommand = async (client, message) => {
    message.command = 'uwu';
    if (!await processCommand(5000, 'channel', message, client)) return;

    const textToUwuify = message.messageText.split(' ').slice(1).join(' ');
    if (!textToUwuify) {
        client.log.logAndReply(message, `Use o formato: ${message.commandPrefix}uwu <mensagem>`);
        return;
    }

    const uwuifiedText = uwuifier.uwuifySentence(textToUwuify);

    client.log.logAndReply(message, `🤖 ${uwuifiedText}`);
    return;
};

uwuCommand.commandName = 'uwu';
uwuCommand.aliases = ['uwu', 'uwuify'];
uwuCommand.shortDescription = 'Uwuifique uma mensagem';
uwuCommand.cooldown = 5000;
uwuCommand.whisperable = true;
uwuCommand.description = `Uwuifique uma mensagem`;
uwuCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/${uwuCommand.commandName}/${uwuCommand.commandName}.js`;

module.exports = {
    testeCommand: uwuCommand,
};
