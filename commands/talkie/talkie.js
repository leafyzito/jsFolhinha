const { processCommand } = require("../../utils/processCommand.js");
const { randomChoice, isStreamOnline } = require("../../utils/utils.js");

const talkieCommand = async (client, message) => {
    message.command = 'talkie';
    if (!await processCommand(5000, 'channel', message, client)) return;

    if (message.messageText.split(' ').length === 1) {
        client.log.logAndReply(message, `Use o formato: ${message.commandPrefix}talkie <mensagem>`);
        return;
    }

    var msgContent = message.messageText.split(' ').slice(1).join(' ');

    const otherPrefixes = ['$', '*', '!', '|', '+', '?', '%', '=', '&', '/', '#', '.', ',', '<', '>', '@', '⠀', '-', '\\', '\\'];
    while (otherPrefixes.some(char => msgContent.startsWith(char))) {
        msgContent = '' + msgContent.slice(1).trim();
    }

    if (msgContent === '') {
        client.log.logAndReply(message, `Use o formato: ${message.commandPrefix}talkie <mensagem válida>`);
        return;
    }

    var joinedChannels = [...client.joinedChannels]; // tirar daqui depois de tentado 1 vez
    let targetChannel;
    let i = 0;
    do {
        i++;
        targetChannel = randomChoice(joinedChannels) || message.channelName;
        const targetConfigs = client.channelConfigs[targetChannel];
        if (targetChannel !== message.channelName
            && targetChannel !== 'folhinha'
            && targetChannel !== 'folhinhabot'
            && !targetConfigs.disabledCommands.includes(message.command)
            && !targetConfigs.devBanCommands.includes(message.command)
            && !targetConfigs.isPaused
            && !await isStreamOnline(targetChannel)
        ) {
            break;
        }
        if (i > 100) {
            client.log.logAndReply(message, `Algo deu errado, contactar @${process.env.DEV_NICK}`);
            return;
        }
        console.log(`infinite loop looking for talkie target, currentTarget: ${targetChannel}`);
        joinedChannels = joinedChannels.filter(channel => channel !== targetChannel);
    } while (true);

    console.log(`talkie ${message.channelName} > ${targetChannel}`);
    client.log.send(targetChannel, `🤖 ${msgContent}`);
    client.log.logAndReply(message, `Mensagem enviada 🤭`);
};

talkieCommand.aliases = ['talkie'];

module.exports = {
    talkieCommand,
};
