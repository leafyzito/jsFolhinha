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

function resetCooldown(identifier, type, command, originalCooldown = 5000, newCooldown = 0) {
    // i couldn't make it set the cooldown to newCooldown seconds ago, so i had to make it set it to originalCooldown - newCooldown help
    let cooldowns2;
    if (type === 'user') {
        cooldowns2 = userCooldowns;
    } else if (type === 'channel') {
        cooldowns2 = channelCooldowns;
    } else {
        throw new Error('Invalid cooldown type');
    }

    let commandCooldown = cooldowns2[identifier];
    if (!commandCooldown) {
        commandCooldown = {};
        cooldowns2[identifier] = commandCooldown;
    }

    commandCooldown[command] = Date.now() - (originalCooldown - newCooldown);
}

async function processCommand(cooldownDuration, type, message, client) {
    isCooldownOver = manageCooldown(cooldownDuration, type, message);
    if (!isCooldownOver) { return false; }

    // check perms to execute
    var currChannelConfigs = client.channelConfigs[message.channelName] || null;
    var currUserBans = client.bans[message.senderUserID];

    if (currUserBans && (currUserBans.includes('all') || currUserBans.includes(message.command))) { return false; }
    if (currChannelConfigs && currChannelConfigs.isPaused) { return false; }
    if (currChannelConfigs && currChannelConfigs.offlineOnly && await isStreamOnline(message.channelName)) { return false; }
    if (currChannelConfigs && currChannelConfigs.disabledCommands.includes(message.command)) {
        client.log.logAndReply(message, `⚠️ Esse comando foi desativado neste chat`);
        return false;
    }
    if (currChannelConfigs && currChannelConfigs.devBanCommands.includes(message.command)) {
        client.log.logAndReply(message, `⚠️ Esse comando foi desativado neste chat pelo dev`);
        return false;
    }

    // if all good to go, manage cooldown
    return true;
}

module.exports = {
    processCommand: processCommand,
    manageCooldown: manageCooldown,
    resetCooldown: resetCooldown
};

