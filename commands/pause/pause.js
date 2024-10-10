const { processCommand } = require("../../utils/processCommand.js");

const pauseCommand = async (client, message) => {
    message.command = 'pause';
    // if (!await processCommand(5000, 'channel', message, client)) return;

    if (message.isStreamer || message.isMod || message.senderUsername === process.env.DEV_NICK) {

        await client.db.update('config', { channel: message.channelName }, { $set: { isPaused: true } });
        await client.reloadChannelConfigs();
        const emote = await client.emotes.getEmoteFromList(message.channelName, ['joia', 'jumilhao'], '👍');
        client.log.logAndReply(message, `pausado ${emote}`)
    }
};

const unpauseCommand = async (client, message) => {
    message.command = 'unpause';
    // if (!await processCommand(5000, 'channel', message, client)) return;

    if (message.isStreamer || message.isMod || message.senderUsername === process.env.DEV_NICK) {

        await client.db.update('config', { channel: message.channelName }, { $set: { isPaused: false } });
        await client.reloadChannelConfigs();
        const emote = await client.emotes.getEmoteFromList(message.channelName, ['joia', 'jumilhao'], '👍');
        client.log.logAndReply(message, `despausado ${emote}`)
    }
};

pauseCommand.commandName = 'pause';
pauseCommand.aliases = ['pause', 'pausar'];
pauseCommand.shortDescription = 'Pausa o bot no chat atual';
pauseCommand.cooldown = 0;
pauseCommand.whisperable = false;
pauseCommand.description = 'Uso: !pause; Resposta esperada: pausado. O bot não irá voltar a responder até !unpause ser usado';
pauseCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/${pauseCommand.commandName}/${pauseCommand.commandName}.js`;

unpauseCommand.commandName = 'unpause';
unpauseCommand.aliases = ['unpause', 'despausar'];
unpauseCommand.shortDescription = 'Despausa o bot no chat atual';
unpauseCommand.cooldown = 0;
unpauseCommand.whisperable = false;
unpauseCommand.description = 'Uso: !unpause; Resposta esperada: despausado. O bot irá voltar a responder';
unpauseCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/${pauseCommand.commandName}/${pauseCommand.commandName}.js`;

module.exports = {
    pauseCommand,
    unpauseCommand,
};
