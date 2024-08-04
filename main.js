require('dotenv').config();
const { ChatClient } = require('@kararty/dank-twitch-irc');
const { modifyClient } = require('./utils/startup.js');
const { commandsList } = require('./commands/commandsList');
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
modifyClient(client, commandsList);

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

function onJoinHandler(channel) {
    console.log(`* ${channel.joinedUsername} joined ${channel.channelName}`);
}

// Called every time the bot connects to Twitch chat
async function onReadyHandler() {
    console.log(`* Connected and ready!`);
    console.log(`* Joining ${channelsToJoin.length} channels`);
    console.log(`* Channels: ${channelsToJoin.join(', ')}`);
}

// Called every time a message comes in
function onMessageHandler(message) {
    if (message.senderUsername == 'folhinhabot') { return; }

    // message.commandPrefix = client.channelPrefixes[message.channelName] || "!";
    // if (message.channelName == 'gocrazybh') {message.commandPrefix = '!!';}

    message.commandPrefix = '!!';

    commandHandler(client, message);
}

