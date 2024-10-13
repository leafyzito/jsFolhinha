require('dotenv').config();
const { ChatClient } = require('@kararty/dank-twitch-irc');
const { modifyClient } = require('./utils/startup.js');
const { commandHandler, listenerHandler } = require('./utils/handlers.js');
const { dailyCookieResetTask, startPetTask, startFetchPendingJoinsTask, startRejoinDisconnectedChannelsTask, startDiscordPresenceTask } = require('./utils/tasks.js');
const cron = require('node-cron');


// Create a client
const client = new ChatClient({
    username: process.env.BOT_USERNAME,
    password: process.env.BOT_IRC_TOKEN,

    ignoreUnhandledPromiseRejections: true,
    maxChannelCountPerConnection: 100,
    connectionRateLimits: {
        parallelConnections: 5,
        releaseTime: 1000
    }
});

// Modify the client with custom functions
modifyClient(client);

// Connect to Twitch
client.connect();

// Register event handlers
client.on('ready', () => { onReadyHandler(); });
client.on('JOIN', (channel) => { onJoinHandler(channel); });
client.on("PRIVMSG", (msg) => { onMessageHandler(msg); });
client.on('WHISPER', (msg) => { onWhisperHandler(msg); });

// Join the channels
const channelsToJoin = process.env.ENV == 'prod' ? client.getChannelsToJoin() : Promise.resolve(['gocrazybh']);
channelsToJoin.then((channels) => {
    client.channelsToJoin = channels;
    client.joinAll(channels);
}).catch((error) => {
    console.log('Error on getting channelsToJoin:', error);
});

// Start tasks
if (process.env.ENV == 'prod') {
    console.log('* Starting tasks');
    cron.schedule('0 9 * * *', async () => { await dailyCookieResetTask(client); });
    startPetTask(client);
    startFetchPendingJoinsTask(client);
}
startRejoinDisconnectedChannelsTask(client);
startDiscordPresenceTask(client);


// handlers
function onJoinHandler(channel) {
    console.log(`* ${channel.joinedUsername} joined ${channel.channelName}`);
}

async function onReadyHandler() {
    console.log(`* Connected and ready! Joining channels...`);
}

client.duplicateMessages = [];
function onMessageHandler(message) {
    // for shared chats, read the original message with priority
    const sourceRoomId = message.ircTags['source-room-id'] || null;
    const sourceMessageId = message.ircTags['source-id'] || null;
    if (sourceRoomId && sourceRoomId !== message.channelID && client.joinedChannelsIds.includes(sourceRoomId)) { return; }
    if (sourceMessageId) { // to avoid duplicate messages
        client.duplicateMessages.push(sourceMessageId);
        if (client.duplicateMessages.length > 100) { client.duplicateMessages.shift(); }
    }

    message.commandPrefix = process.env.ENV === 'prod' ? client.channelPrefixes[message.channelName] || '!' : '!!';

    message.isStreamer = message.badges.hasBroadcaster;
    if (message.isStreamer) { message.isMod = true; } //consider streamer as mod
    message.isVip = message.badges.hasVIP;
    message.isFirstMsg = message.ircTags['first-msg'] === '1' ? true : false;

    listenerHandler(client, message);
    commandHandler(client, message);
}

function onWhisperHandler(message) {
    // log whisper to discord
    client.discord.logWhisperFrom(message);
}