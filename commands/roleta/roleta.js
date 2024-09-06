const { processCommand } = require("../../utils/processCommand.js");
const { randomInt } = require("../../utils/utils.js");

const roletaCommand = async (client, message) => {
    message.command = 'roleta';
    if (!await processCommand(5000, 'channel', message, client)) return;

    if (message.senderUsername === message.channelName) {
        client.log.logAndReply(message, `Eu não consigo te explodir, mas você consegue monkaS`);
        return;
    }

    if (message.isMod) {
        client.log.logAndReply(message, `Infelizmente não consigo te explodir 😡`);
        return;
    }

    var timeoutDuration = message.messageText.split(' ')[1] || 10;
    timeoutDuration = parseInt(timeoutDuration) * 60;

    const randomChance = randomInt(1, 6);
    if (randomChance !== 1) {
        const emote = await client.emotes.getEmoteFromList(message.channelName, ['saved'], 'monkaS');
        client.log.logAndReply(message, `Click! Não foi dessa vez ${emote}`);
        return;
    }

    const timeout = await client.timeoutUser(message, timeoutDuration, 'foi de roleta russa');

    if (!timeout) {
        client.log.logAndReply(message, `Eu não tenho mod, não vai não :(`);
        return;
    }

    const emote = await client.emotes.getEmoteFromList(message.channelName, ['ripbozo'], ':tf:');
    client.log.logAndSay(message, `BANG! Foi de arrasta pra cima ${emote}`);
};

roletaCommand.commandName = 'roleta';
roletaCommand.aliases = ['roleta', 'rr'];
roletaCommand.shortDescription = 'Teste a sua sorte com a roleta-russa do timeout';
roletaCommand.cooldown = 5000;
roletaCommand.whisperable = false;
roletaCommand.description = 'Uso: !roleta; Resposta esperada: BANG! Foi de arrasta pra cima 🤫; É necessário o bot ser moderador para este comando ter efeito';
roletaCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/${roletaCommand.commandName}/${roletaCommand.commandName}.js`;

module.exports = {
    roletaCommand,
};
