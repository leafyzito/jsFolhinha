const { processCommand } = require("../../utils/processCommand.js");

const meCommand = async (client, message) => {
    message.command = 'me';
    if (!await processCommand(5000, 'channel', message, client)) return;

    if (message.messageText.split(' ').length < 2) {
        client.log.logAndReply(message, `Use o formato: ${message.commandPrefix}me <mensagem>`);
        return;
    }
    var msgContent = message.messageText.split(' ').slice(1).join(' ').trim();

    const otherPrefixes = ['$', '*', '!', '|', '+', '?', '%', '=', '&', '/', '#', '.', ',', '<', '>', '@', '⠀', '-', '\\', '\\'];
    while (otherPrefixes.some(char => msgContent.startsWith(char))) {
        msgContent = '' + msgContent.slice(1).trim();
    }

    if (msgContent === '') {
        client.log.logAndReply(message, `Use o formato: ${message.commandPrefix}me <mensagem>`);
        return;
    }

    client.log.logAndMeAction(message, msgContent);
};

meCommand.commandName = 'me';
meCommand.aliases = ['me'];
meCommand.shortDescription = 'Faz o bot mandar uma mensagem /me';
meCommand.cooldown = 5000;
meCommand.whisperable = false;
meCommand.description = `Forneça uma mensagem para o bot enviar com a funcionalidade /me
• Exemplo: !me Olá mundo - O bot irá enviar: /me Olá mundo`;
meCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/${meCommand.commandName}/${meCommand.commandName}.js`;

module.exports = {
    meCommand,
};
