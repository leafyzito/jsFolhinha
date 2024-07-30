require('dotenv').config();
const { ChatClient } = require('@kararty/dank-twitch-irc');
const { MongoUtils } = require('./utils/mongo.js');
const { modifyClient, channelPrefixes } = require('./utils/startup.js');
const { commandHandler } = require('./utils/handlers.js');
const fs = require('fs');


// Read the channels.txt file
const channelsFile = fs.readFileSync('channels.txt', 'utf-8');
// Split the file contents by line
const channelsLines = channelsFile.split('\n');
// Create an empty array to store the channel names
const channelsToJoin = [];
// Iterate over each line and extract the channel name
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

// Join the channels
// client.joinAll(channelsToJoin);
client.join('gocrazybh');

function onJoinHandler(channel) {
    console.log(`* ${channel.joinedUsername} joined ${channel.channelName}`);
}

// Called every time the bot connects to Twitch chat
function onReadyHandler() {
    console.log(`* Connected and ready!`);
    console.log(`* Joining ${channelsToJoin.length} channels`);
    console.log(`* Channels: ${channelsToJoin.join(', ')}`);

    // get configs from 'config' mongo table
    const mongoUtils = new MongoUtils();
    mongoUtils.get('config', {}).then((result) => {
        result.forEach((config) => {
            channelPrefixes[config.channel] = config.prefix;
        });
    });
}

// Called every time a message comes in
function onMessageHandler(message) {
    if (message.senderUsername == 'folhinhabot') { return; }

    message.commandPrefix = channelPrefixes[message.channelName] || "!";
    if (message.channelName == 'gocrazybh') {message.commandPrefix = '!!';}

    commandHandler(client, message);
}

