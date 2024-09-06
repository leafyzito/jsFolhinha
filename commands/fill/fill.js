const { processCommand } = require("../../utils/processCommand.js");

const fillCommand = async (client, message) => {
    message.command = 'fill';
    if (!await processCommand(5000, 'channel', message, client)) return;

    if (message.messageText.split(' ').length < 2) {
        client.log.logAndReply(message, `Use o formato: ${message.commandPrefix}me <mensagem>`);
        return;
    }

    var textToRepeat = message.messageText.split(' ').slice(1).join(' ');

    const otherPrefixes = ['$', '*', '!', '|', '+', '?', '%', '=', '&', '/', '#', '.', ',', '<', '>', '@', '⠀', '-', '\\', '\\'];
    while (otherPrefixes.some(char => textToRepeat.startsWith(char))) {
        textToRepeat = '' + textToRepeat.slice(1).trim();
    }

    const maxLength = 500;
    var finalText = '';

    while (finalText.length < maxLength) {
        finalText += textToRepeat + ' ';
    }

    finalText = finalText.slice(0, maxLength);

    client.log.logAndReply(message, finalText);
};

fillCommand.commandName = 'fill';
fillCommand.aliases = ['fill'];
fillCommand.shortDescription = 'Faça o bot enviar uma mensagem cheia do que você quiser';
fillCommand.cooldown = 5000;
fillCommand.whisperable = true;
fillCommand.description = 'Uso: !fill <qualquer coisa>; Resposta esperada: {mensagem repetindo o padrão do que foi pedido}';
fillCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/${fillCommand.commandName}/${fillCommand.commandName}.js`;

module.exports = {
    fillCommand,
};
