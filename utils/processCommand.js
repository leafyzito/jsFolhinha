const { isStreamOnline } = require('../utils/utils.js');

// Define variables to store the last execution time for each user and channel
var userCooldowns = {};
var channelCooldowns = {};

// Function to manage the cooldown
function manageCooldown(cooldownDuration, type, message) {
    // Get the current time
    const currentTime = Date.now();
    var identifier = message.senderUsername;
    var command = message.command;

    // Determine the cooldown object based on the type
    let cooldowns;
    if (type === 'user') {
        cooldowns = userCooldowns;
    } else if (type === 'channel') {
        cooldowns = channelCooldowns;
        identifier = message.channelName;
    } else {
        throw new Error('Invalid cooldown type');
    }

    // Get the command cooldown object for the specified identifier
    let commandCooldown = cooldowns[identifier];
    if (!commandCooldown) {
        commandCooldown = {};
        cooldowns[identifier] = commandCooldown;
    }

    // Get the last execution time for the specified command
    const lastExecutionTime = commandCooldown[command] || 0;

    // Calculate the time elapsed since the last execution
    const timeElapsed = currentTime - lastExecutionTime;

    // Check if the cooldown is over
    if (timeElapsed >= cooldownDuration) {
        commandCooldown[command] = currentTime;
        return true;
    }

    // Return false to indicate that the cooldown is not over
    console.log(`CD: #${message.channelName}/${message.senderUsername} - ${message.command} (${Math.ceil((cooldownDuration - timeElapsed) / 1000)}s)`);
    return false;
}

async function processCommand(cooldownDuration, type, message, client) {
    // check perms to execute
    var currChannelConfigs = client.channelConfigs[message.channelName] || null;
    var currUserBans = client.bans[message.senderUserID];

    if (currUserBans && (currUserBans.includes('all') || currUserBans.includes(message.command))) { return false; }
    if (currChannelConfigs && currChannelConfigs.isPaused) { return false; }
    if (currChannelConfigs && currChannelConfigs.disabledCommands.includes(message.command)) { return false; }
    if (currChannelConfigs && currChannelConfigs.devBanCommands.includes(message.command)) { return false; }
    if (currChannelConfigs && currChannelConfigs.offlineOnly && await isStreamOnline(message.channelName)) { return false; }

    // if all good to go, manage cooldown
    return manageCooldown(cooldownDuration, type, message);
}

module.exports = {
    processCommand: processCommand,
    manageCooldown: manageCooldown
};

