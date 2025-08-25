// Define variables to store the last execution time for each user and channel
const { commandsList } = require("./commandsList");

const userCooldowns = {};
const channelCooldowns = {};

// Function to manage the cooldown
function manageCooldown(cooldownDuration, type, message) {
  // Get the current time
  const currentTime = Date.now();
  let identifier = message.senderUsername;
  const command = message.command;

  // if channel is whisper, set type to user, no matter what type is passed
  if (message.channelName === "whisper") {
    type = "user";
  }

  // Determine the cooldown object based on the type
  let cooldowns;
  if (type === "user") {
    cooldowns = userCooldowns;
  } else if (type === "channel") {
    cooldowns = channelCooldowns;
    identifier = message.channelName;
  } else {
    throw new Error("Invalid cooldown type");
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
  console.log(
    `CD: #${message.channelName}/${message.senderUsername} - ${
      message.command
    } (${Math.ceil((cooldownDuration - timeElapsed) / 1000)}s)`
  );
  return false;
}

async function checkUserPermissions(message, requiredPermissions) {
  // Check if user is admin
  if (message.isAdmin && requiredPermissions.includes("admin")) {
    return true;
  }

  // Check if user is streamer
  if (message.isStreamer && requiredPermissions.includes("streamer")) {
    return true;
  }

  // Check if user is moderator
  if (message.isMod && requiredPermissions.includes("mod")) {
    return true;
  }

  // Check if user is VIP
  if (message.isVip && requiredPermissions.includes("vip")) {
    return true;
  }

  // Check if user is subscriber
  if (message.isSub && requiredPermissions.includes("sub")) {
    return true;
  }

  return false;
}

async function validateCommandExecution(cooldownDuration, type, message) {
  const isCooldownOver = manageCooldown(cooldownDuration, type, message);
  if (!isCooldownOver) {
    return false;
  }

  // Check command permissions
  const command = commandsList[message.command];
  // if command has permissions, check if user has permission
  if (command && command.permissions && command.permissions.length > 0) {
    const hasPermission = await checkUserPermissions(
      message,
      command.permissions
    );
    if (!hasPermission) {
      fb.log.logAndReply(
        message,
        `⚠️ Este comando é reservado para ${command.permissions.join(", ")}`
      );
      return false;
    }
  }

  if (command.flags && command.flags.includes("always")) {
    // for specific commands, if the command has the flag "always", it will always be executed, not matter if paused, stream on or whatever
    return true;
  }

  // check perms to execute from
  const currChannelConfigs = await fb.db.get("config", {
    channelId: message.channelID,
  });
  let currUserBans = await fb.db.get("bans", {
    userId: message.senderUserID,
  });

  if (currUserBans && !Array.isArray(currUserBans)) {
    currUserBans = [currUserBans];
  }

  // Check if user has any bans - iterate through all ban records
  if (currUserBans) {
    for (const banRecord of currUserBans) {
      if (
        banRecord.bannedCommands &&
        (banRecord.bannedCommands.includes("all") ||
          banRecord.bannedCommands.includes(message.command))
      ) {
        return false;
      }
    }
  }
  if (currChannelConfigs && currChannelConfigs.isPaused) {
    return false;
  }
  if (
    currChannelConfigs &&
    currChannelConfigs.offlineOnly &&
    (await fb.api.helix.isStreamOnline(message.channelName))
  ) {
    return false;
  }
  if (
    currChannelConfigs &&
    currChannelConfigs.disabledCommands.includes(message.command)
  ) {
    fb.log.logAndReply(message, `⚠️ Esse comando foi desativado neste chat`);
    return false;
  }
  if (
    currChannelConfigs &&
    currChannelConfigs.devBanCommands.includes(message.command)
  ) {
    fb.log.logAndReply(
      message,
      `⚠️ Esse comando foi desativado neste chat pelo dev`
    );
    return false;
  }

  return true;
}

module.exports = {
  validateCommandExecution,
  manageCooldown,
};
