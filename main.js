import 'dotenv/config';
import { ChatClient } from '@mastondzn/dank-twitch-irc';
import { modifyClient } from './utils/startup.js';
import { commandHandler, listenerHandler } from './utils/handlers.js';
import {
    dailyCookieResetTask,
    startPetTask,
    startFetchPendingJoinsTask,
    startRejoinDisconnectedChannelsTask,
    startDiscordPresenceTask,
} from './utils/tasks.js';
import cron from 'node-cron';
const client = new ChatClient({
    username: process.env.BOT_USERNAME,
    password: process.env.BOT_IRC_TOKEN,
    ignoreUnhandledPromiseRejections: true,
    maxChannelCountPerConnection: 100,
    connectionRateLimits: {
        parallelConnections: 5,
        releaseTime: 1e3,
    },
});
const anonClient = new ChatClient({
    username: 'justinfan12345',
    // Anonymous username
    password: void 0,
    // No password needed for anonymous login
    // Optimized for anonymous connection
    rateLimits: 'verifiedBot',
    // Anon connections are allowed higher limits
    connection: {
        type: 'websocket',
        secure: true,
        // Use secure websocket connection
    },
    maxChannelCountPerConnection: 200,
    // Maximum allowed for anonymous connections
    connectionRateLimits: {
        parallelConnections: 10,
        // Maximum parallel connections for anonymous
        releaseTime: 100,
        // Reduced wait time between connections
    },
    requestMembershipCapability: false,
    // Disable membership capability for faster joins
    installDefaultMixins: false,
    // Disable mixins for better performance
    ignoreUnhandledPromiseRejections: true,
});
modifyClient(client, anonClient);
client.connect();
anonClient.connect();
anonClient.on('ready', () => {
    onReadyHandler();
});
anonClient.on('JOIN', channel => {
    onJoinHandler(channel);
});
anonClient.on('PRIVMSG', msg => {
    onMessageHandler(msg);
});
anonClient.on('CLEARCHAT', msg => {
    onClearChatHandler(msg);
});
client.on('WHISPER', msg => {
    onWhisperHandler(msg);
});
const channelsToJoin =
    process.env.ENV == 'prod'
        ? client.getChannelsToJoin()
        : Promise.resolve([process.env.DEV_TEST_CHANNEL]);
channelsToJoin
    .then(channels => {
        client.channelsToJoin = channels;
        anonClient.channelsToJoin = channels;
        anonClient.joinAll(channels);
    })
    .catch(error => {
        console.log('Error on getting channelsToJoin:', error);
    });
if (process.env.ENV == 'prod') {
    console.log('* Starting tasks');
    cron.schedule('0 9 * * *', async () => {
        await dailyCookieResetTask(client);
    });
    startPetTask(client, anonClient);
    startFetchPendingJoinsTask(client, anonClient);
}
startRejoinDisconnectedChannelsTask(client, anonClient);
startDiscordPresenceTask(client, anonClient);
function onJoinHandler(channel) {
    console.log(`* ${channel.joinedUsername} joined ${channel.channelName}`);
}
function onReadyHandler() {
    console.log(`* Connected and ready! Joining channels...`);
}
client.duplicateMessages = [];
function onMessageHandler(message) {
    const sourceRoomId = message.ircTags['source-room-id'] || null;
    const sourceMessageId = message.ircTags['source-id'] || null;
    if (
        sourceRoomId &&
        sourceRoomId !== message.channelID &&
        client.joinedChannelsIds.includes(sourceRoomId)
    ) {
        return;
    }
    if (sourceMessageId) {
        client.duplicateMessages.push(sourceMessageId);
        if (client.duplicateMessages.length > 100) {
            client.duplicateMessages.shift();
        }
    }
    message.commandPrefix =
        process.env.ENV === 'prod' ? client.channelPrefixes[message.channelName] || '!' : '!!';
    message.internalTimestamp = /* @__PURE__ */ new Date().getTime();
    message.isStreamer = message.badges.hasBroadcaster;
    if (message.isStreamer) {
        message.isMod = true;
    }
    message.isVip = message.badges.hasVIP;
    message.isFirstMsg = message.ircTags['first-msg'] === '1' ? true : false;
    listenerHandler(client, message, anonClient);
    commandHandler(client, message, anonClient);
}
function onWhisperHandler(message) {
    message.commandPrefix = '!';
    message.internalTimestamp = /* @__PURE__ */ new Date().getTime();
    message.serverTimestamp = /* @__PURE__ */ new Date();
    message.serverTimestampRaw = /* @__PURE__ */ new Date().getTime();
    message.channelName = 'whisper';
    const validPrefixes = [
        '?',
        '&',
        '%',
        '+',
        '*',
        '-',
        '=',
        '|',
        '@',
        '#',
        '$',
        '~',
        '\\',
        '_',
        ',',
        ';',
        '<',
        '>',
    ];
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
        console.log(
            `* ${message.isTimeout() ? `Tomei timeout em #${message.channelName} por ${message.banDuration} segundos` : `Fui banido em #${message.channelName}`}`
        );
        client.discord.importantLog(
            `* ${message.isTimeout() ? `Tomei timeout em #${message.channelName} por ${message.banDuration} segundos` : `Fui banido em #${message.channelName}`}`
        );
    }
}
