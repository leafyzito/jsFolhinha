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


module.exports = {
    fillCommand: fillCommand,
    fillAliases: ['fill']
};
