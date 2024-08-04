const { processCommand } = require("../../utils/processCommand.js");

const pauseCommand = async (client, message) => {
    message.command = 'pause';
    if (!await processCommand(5000, 'channel', message, client)) return;

    if (message.senderUsername === message.channelName || message.isMod || message.senderUsername === process.env.DEV_NICK) {

        await client.db.update('config', { channel: message.channelName }, { $set: { isPaused: true } });
        await client.reloadChannelConfigs();
        client.log.logAndReply(message, 'pausado 👍')
    }
};

const unpauseCommand = async (client, message) => {
    message.command = 'unpause';
    if (!await processCommand(5000, 'channel', message, client)) return;

    if (message.senderUsername === message.channelName || message.isMod || message.senderUsername === process.env.DEV_NICK) {

        await client.db.update('config', { channel: message.channelName }, { $set: { isPaused: false } });
        await client.reloadChannelConfigs();
        client.log.logAndReply(message, 'despausado 👍')
    }
};

pauseCommand.aliases = ['pause', 'pausar'];
unpauseCommand.aliases = ['unpause', 'despausar'];

module.exports = {
    pauseCommand,
    unpauseCommand,
};
