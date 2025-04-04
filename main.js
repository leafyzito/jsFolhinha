require('dotenv').config();
const { ChatClient } = require('@kararty/dank-twitch-irc');
const { modifyClient } = require('./utils/startup.js');
const { commandHandler, listenerHandler } = require('./utils/handlers.js');
const { dailyCookieResetTask, startPetTask, startFetchPendingJoinsTask, startRejoinDisconnectedChannelsTask, startDiscordPresenceTask } = require('./utils/tasks.js');
const cron = require('node-cron');

// Create the main bot client for sending messages
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

// Create anonymous client for reading messages
const anonClient = new ChatClient({
    username: 'justinfan12345', // Anonymous username
    password: 'kappa123',  // Any password works for anonymous login

    ignoreUnhandledPromiseRejections: true,
    maxChannelCountPerConnection: 200, // Doubled since anon client has less restrictions
    connectionRateLimits: {
        parallelConnections: 10, // Doubled since anon client has less restrictions
        releaseTime: 500 // Halved since anon client has less restrictions
    }
});

// Modify the main client with custom functions
modifyClient(client, anonClient);

// Connect both clients to Twitch
client.connect();
anonClient.connect();

// Register event handlers on the anonymous client for reading messages
anonClient.on('ready', () => { onReadyHandler(); });
anonClient.on('JOIN', (channel) => { onJoinHandler(channel); });
anonClient.on("PRIVMSG", (msg) => { onMessageHandler(msg); });
anonClient.on('CLEARCHAT', (msg) => { onClearChatHandler(msg); });

// Register whisper handler on main client (since anon can't receive whispers)
client.on('WHISPER', (msg) => { onWhisperHandler(msg); });

// Join the channels with both clients
const channelsToJoin = process.env.ENV == 'prod' ? client.getChannelsToJoin() : Promise.resolve([process.env.DEV_TEST_CHANNEL]);
channelsToJoin.then((channels) => {
    client.channelsToJoin = channels;
    anonClient.channelsToJoin = channels;
    // client.joinAll(channels);
    anonClient.joinAll(channels);
}).catch((error) => {
    console.log('Error on getting channelsToJoin:', error);
});

// Start tasks
if (process.env.ENV == 'prod') {
    console.log('* Starting tasks');
    cron.schedule('0 9 * * *', async () => { await dailyCookieResetTask(client); });
    startPetTask(client, anonClient);
    startFetchPendingJoinsTask(client, anonClient);
}
startRejoinDisconnectedChannelsTask(client, anonClient);
startDiscordPresenceTask(client, anonClient);

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
    message.internalTimestamp = new Date().getTime();
    message.isStreamer = message.badges.hasBroadcaster;
    if (message.isStreamer) { message.isMod = true; } //consider streamer as mod
    message.isVip = message.badges.hasVIP;
    message.isFirstMsg = message.ircTags['first-msg'] === '1' ? true : false;

    // Pass both clients to handlers - anon for reading, main for sending
    listenerHandler(client, message, anonClient);
    commandHandler(client, message, anonClient);
}

function onWhisperHandler(message) {
    message.commandPrefix = '!';
    message.internalTimestamp = new Date().getTime();
    message.serverTimestamp = new Date();
    message.serverTimestampRaw = new Date().getTime();
    message.channelName = "whisper";

    // if the message starts with any valid prefix, replace it with "!"
    const validPrefixes = ['?', '&', '%', '+', '*', '-', '=', '|', '@', '#', '$', '~', '\\', '_', ',', ';', '<', '>'];
    for (const prefix of validPrefixes) {
        if (message.messageText.startsWith(prefix)) {
            message.messageText = message.messageText.replace(prefix, message.commandPrefix);
        }
    }

    if (process.env.ENV == 'prod') {
        commandHandler(client, message, anonClient);
    }
    if (!message.messageText.startsWith(message.commandPrefix)) {
        client.discord.logWhisperFrom(message);
    }
}

function onClearChatHandler(message) {
    if (message.targetUsername === process.env.BOT_USERNAME) {
        console.log(`* ${message.isTimeout() ? `Tomei timeout em #${message.channelName} por ${message.banDuration} segundos` : `Fui banido em #${message.channelName}`}`);
        // client.log.send(process.env.DEV_TEST_CHANNEL, `${message.isTimeout() ? `Tomei timeout em #${message.channelName} por ${message.banDuration} segundos` : `Fui banido em #${message.channelName} @${process.env.DEV_NICK}`}`);
        client.discord.importantLog(`* ${message.isTimeout() ? `Tomei timeout em #${message.channelName} por ${message.banDuration} segundos` : `Fui banido em #${message.channelName}`}`);
    }
}