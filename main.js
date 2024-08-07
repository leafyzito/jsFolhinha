require('dotenv').config();
const { ChatClient } = require('@kararty/dank-twitch-irc');
const { modifyClient } = require('./utils/startup.js');
const { commandHandler, listenerHandler } = require('./utils/handlers.js');
const { dailyCookieResetTask, startPetTask } = require('./utils/tasks.js');
const fs = require('fs');
const cron = require('node-cron');


// Load the channels to join from the channels.txt
const channelsFile = fs.readFileSync('channels.txt', 'utf-8');
const channelsLines = channelsFile.split('\n');
const channelsToJoin = [];
channelsLines.forEach((line) => {
    const channelName = line.split(' ')[1];
    if (channelName) {
        channelsToJoin.push(channelName.replace('\r', ''));
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
client.on("PRIVMSG", (msg) => { onMessageHandler(msg); });
// client.on('error', (error) => { console.log('Error:', error); });

// Join the channels
// client.joinAll(channelsToJoin);
client.join('gocrazybh');

// Schedule tasks
cron.schedule('0 9 * * *', async () => { await dailyCookieResetTask(client); });
// startPetTask(client);


// handlers
function onJoinHandler(channel) {
    console.log(`* ${channel.joinedUsername} joined ${channel.channelName}`);
}

async function onReadyHandler() {
    console.log(`* Connected and ready!`);
    console.log(`* Joining ${channelsToJoin.length} channels`);
    console.log(`* Channels: ${channelsToJoin.join(', ')}`);
}

function onMessageHandler(message) {
    if ([...client.knownUserAliases].length === 0) { return console.log('still loading users'); }
    if (message.senderUsername == 'folhinhabot') { return; }

    // message.commandPrefix = client.channelPrefixes[message.channelName] || "!";
    // if (message.channelName == 'gocrazybh') {message.commandPrefix = '!!';}

    message.commandPrefix = '!!'; // for testing

    if (message.senderUsername === message.channelName) {
        message.isMod = true;
        message.isStreamer = true;
    } else { message.isStreamer = false; }

    commandHandler(client, message);
    listenerHandler(client, message);
}

