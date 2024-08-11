const { processCommand } = require("../../utils/processCommand.js");

const pauseCommand = async (client, message) => {
    message.command = 'pause';
    if (!await processCommand(5000, 'channel', message, client)) return;

    if (message.isStreamer || message.isMod || message.senderUsername === process.env.DEV_NICK) {

        await client.db.update('config', { channel: message.channelName }, { $set: { isPaused: true } });
        await client.reloadChannelConfigs();
        const emote = await client.emotes.getEmoteFromList(message.channelName, ['joia', 'jumilhao'], '👍');
        client.log.logAndReply(message, `pausado ${emote}`)
    }
};

const unpauseCommand = async (client, message) => {
    message.command = 'unpause';
    if (!await processCommand(5000, 'channel', message, client)) return;

    if (message.isStreamer || message.isMod || message.senderUsername === process.env.DEV_NICK) {

        await client.db.update('config', { channel: message.channelName }, { $set: { isPaused: false } });
        await client.reloadChannelConfigs();
        const emote = await client.emotes.getEmoteFromList(message.channelName, ['joia', 'jumilhao'], '👍');
        client.log.logAndReply(message, `despausado ${emote}`)
    }
};

pauseCommand.aliases = ['pause', 'pausar'];
unpauseCommand.aliases = ['unpause', 'despausar'];

module.exports = {
    pauseCommand,
    unpauseCommand,
};
