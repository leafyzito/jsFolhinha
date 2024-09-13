require('dotenv').config();
const { ChatClient } = require('@kararty/dank-twitch-irc');
const { modifyClient } = require('./utils/startup.js');
const { commandHandler, listenerHandler } = require('./utils/handlers.js');
const { dailyCookieResetTask, startPetTask, startFetchPendingJoinsTask } = require('./utils/tasks.js');
const fs = require('fs');
const cron = require('node-cron');


// Load the channels to join from the channels.txt
const channelsFile = fs.readFileSync('channels.txt', 'utf-8');
const channelsLines = channelsFile.split('\n');
const channelIds = [];
channelsLines.forEach((line) => {
    const cId = line.split(' ')[0];
    if (cId) {
        channelIds.push(cId.replace('\r', ''));
    }
});

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
client.on('PRIVMSG', (msg) => { onMessageHandler(msg); });
client.on('WHISPER', (msg) => { onWhisperHandler(msg); });
// client.on('error', (error) => { console.log('Error:', error); });

// // Join the channels
// const channelsToJoin = client.getManyUsersByUserIDs(channelIds);
// channelsToJoin.then((channels) => {
//     client.joinAll(channels);
// }).catch((error) => {
//     console.log('Error on getting channelsToJoin:', error);
// });

// // Schedule tasks
// cron.schedule('0 9 * * *', async () => { await dailyCookieResetTask(client); });
// startPetTask(client);
// startFetchPendingJoinsTask(client);

client.join('gocrazybh');


// handlers
function onJoinHandler(channel) {
    console.log(`* ${channel.joinedUsername} joined ${channel.channelName}`);
}

async function onReadyHandler() {
    console.log(`* Connected and ready! Joining channels...`);
}

function onMessageHandler(message) {
    if (message.senderUsername == 'folhinhabot') { return; }

    // message.commandPrefix = client.channelPrefixes[message.channelName] || "!";
    message.commandPrefix = '!!'; // for testing

    if (message.senderUsername === message.channelName) {
        message.isMod = true;
        message.isStreamer = true;
    } else { message.isStreamer = false; }

    listenerHandler(client, message);
    commandHandler(client, message);
}

function onWhisperHandler(message) {
    console.log(message);
    client.log.logAndWhisper(message, 'avisem o leafy se receberem essa mensagem pufavo');
}