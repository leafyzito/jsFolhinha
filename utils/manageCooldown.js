// Define variables to store the last execution time for each user and channel
const userCooldowns = {};
const channelCooldowns = {};

// Function to manage the cooldown
function manageCooldown(cooldownDuration, type, identifier, command) {
    // Get the current time
    const currentTime = Date.now();

    // Determine the cooldown object based on the type
    let cooldowns;
    if (type === 'user') {
        cooldowns = userCooldowns;
    } else if (type === 'channel') {
        cooldowns = channelCooldowns;
        identifier = 'channel'; // Set identifier to 'channel' for channel cooldown
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
    console.log('Cooldown not over');
    return false;
}

module.exports = { manageCooldown: manageCooldown };

