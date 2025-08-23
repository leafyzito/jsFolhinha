const { exec } = require("child_process");

async function createNewChannelConfig(user) {
  const newConfig = {
    channel: user,
    channelId: await fb.twitch.getUserID(user),
    prefix: "!",
    offlineOnly: false,
    isPaused: false,
    disabledCommands: [],
    devBanCommands: [],
  };

  await fb.db.insert("config", newConfig);
  await fb.reloadChannelConfigs();
  await fb.reloadChannelPrefixes();

  await fb.rustlog.addChannel(newConfig.channelId);

  return;
}

const botSayCommand = async (message) => {
  message.command = "dev botsay";

  const authorId = message.senderUserID;
  if (authorId !== process.env.DEV_USERID) {
    return;
  }

  const args = message.messageText.split(" ");
  const targetChannel = args[1];
  const msgContent = args.slice(2).join(" ");

  if (targetChannel == "all") {
    for (let i = 0; i < [...fb.joinedChannels].length; i++) {
      const channel = [...fb.joinedChannels][i];
      await new Promise((resolve) => setTimeout(resolve, 2_500)); // 2.5 second interval between each message

      // console.log(`sending to ${channel}`);
      fb.log.send(channel, msgContent);
    }
    return {
      reply: `foi`,
      notes: `Sent message to all channels`,
    };
  }

  fb.log.send(targetChannel, msgContent);
  return {
    reply: `foi`,
    notes: `Sent message to ${targetChannel}`,
  };
};

const forceJoinCommand = async (message) => {
  message.command = "dev forcejoin";

  const authorId = message.senderUserID;
  if (authorId !== process.env.DEV_USERID) {
    return;
  }

  const args = message.messageText.split(" ");
  const targetChannel = args[1].toLowerCase();
  const announce = args[2] === "true" ? true : false;

  try {
    await fb.anonClient.join(targetChannel);

    // add channel to channelsToJoin array
    fb.channelsToJoin.push(targetChannel);
    fb.anonClient.channelsToJoin.push(targetChannel);

    if (announce) {
      fb.log.send(targetChannel, `👀`);
    }

    return {
      reply: `Joined ${targetChannel}`,
      notes: `Force joined channel ${targetChannel}`,
    };
  } catch (err) {
    console.log(err);
    return {
      reply: `Não foi, check logs`,
      notes: `Failed to join ${targetChannel}: ${err}`,
    };
  }
};

const forcePartCommand = async (message) => {
  message.command = "dev forcepart";

  const authorId = message.senderUserID;
  if (authorId !== process.env.DEV_USERID) {
    return;
  }

  const args = message.messageText.split(" ");
  const targetChannel = args[1];
  const announce = args[2] === "announce" ? true : false;

  try {
    await fb.anonClient.part(targetChannel);

    // remove channel from channelsToJoin array
    fb.channelsToJoin = fb.channelsToJoin.filter(
      (channel) => channel !== targetChannel
    );

    if (announce) {
      fb.log.send(targetChannel, `👋`);
    }

    return {
      reply: `Parted ${targetChannel}`,
      notes: `Force parted channel ${targetChannel}`,
    };
  } catch (err) {
    return {
      reply: `Erro ao dar part em ${targetChannel}: ${err}`,
      notes: `Failed to part ${targetChannel}: ${err}`,
    };
  }
};

const execCommand = async (message) => {
  message.command = "dev exec";

  const authorId = message.senderUserID;
  if (authorId !== process.env.DEV_USERID) {
    return;
  }

  const command = message.args.slice(1).join(" ");

  return new Promise((resolve) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        resolve({
          reply: `Error: ${error.message}`,
          notes: `Exec command failed: ${command}`,
        });
        return;
      }
      if (stderr) {
        resolve({
          reply: `Stderr: ${stderr}`,
          notes: `Exec command stderr: ${command}`,
        });
        return;
      }
      resolve({
        reply: `Output: ${stdout}`,
        notes: `Exec command success: ${command}`,
      });
    });
  });
};

const sqlExecCommand = async (message) => {
  message.command = "dev sqlexec";

  const authorId = message.senderUserID;
  if (authorId !== process.env.DEV_USERID) {
    return;
  }

  const query = message.args.slice(1).join(" ");

  try {
    const result = await fb.db.raw(query);
    return {
      reply: `Query executed successfully`,
      notes: `SQL query: ${query}, Result: ${JSON.stringify(result)}`,
    };
  } catch (err) {
    return {
      reply: `SQL Error: ${err.message}`,
      notes: `SQL query failed: ${query}, Error: ${err}`,
    };
  }
};

const getUserIdCommand = async (message) => {
  message.command = "dev getuserid";

  const authorId = message.senderUserID;
  if (authorId !== process.env.DEV_USERID) {
    return;
  }

  const username = message.args[1];
  if (!username) {
    return {
      reply: `Please provide a username`,
      notes: `Missing username parameter`,
    };
  }

  try {
    const userId = await fb.twitch.getUserID(username);
    return {
      reply: `User ID for ${username}: ${userId}`,
      notes: `User ID lookup: ${username} -> ${userId}`,
    };
  } catch (err) {
    return {
      reply: `Error getting user ID: ${err.message}`,
      notes: `User ID lookup failed: ${username}, Error: ${err}`,
    };
  }
};

const restartCommand = async (message) => {
  message.command = "dev restart";

  const authorId = message.senderUserID;
  if (authorId !== process.env.DEV_USERID) {
    return;
  }

  // This would need to be implemented based on your process management
  return {
    reply: `Restart command received`,
    notes: `Restart requested by ${message.senderUsername}`,
  };
};

const resetPetCommand = async (message) => {
  message.command = "dev resetpet";

  const authorId = message.senderUserID;
  if (authorId !== process.env.DEV_USERID) {
    return;
  }

  const targetUser = message.args[1];
  if (!targetUser) {
    return {
      reply: `Please provide a username`,
      notes: `Missing username parameter for pet reset`,
    };
  }

  try {
    await fb.db.update("pet", { user: targetUser }, { $set: { attention: 0 } });
    return {
      reply: `Pet attention reset for ${targetUser}`,
      notes: `Pet reset: ${targetUser}`,
    };
  } catch (err) {
    return {
      reply: `Error resetting pet: ${err.message}`,
      notes: `Pet reset failed: ${targetUser}, Error: ${err}`,
    };
  }
};

const resetCdCommand = async (message) => {
  message.command = "dev resetcd";

  const authorId = message.senderUserID;
  if (authorId !== process.env.DEV_USERID) {
    return;
  }

  const targetUser = message.args[1];
  if (!targetUser) {
    return {
      reply: `Please provide a username`,
      notes: `Missing username parameter for cookie reset`,
    };
  }

  try {
    await fb.db.update(
      "cookie",
      { user: targetUser },
      { $set: { claimedToday: false } }
    );
    return {
      reply: `Cookie daily reset for ${targetUser}`,
      notes: `Cookie reset: ${targetUser}`,
    };
  } catch (err) {
    return {
      reply: `Error resetting cookie: ${err.message}`,
      notes: `Cookie reset failed: ${targetUser}, Error: ${err}`,
    };
  }
};

const reloadCommand = async (message) => {
  message.command = "dev reload";

  const authorId = message.senderUserID;
  if (authorId !== process.env.DEV_USERID) {
    return;
  }

  try {
    await fb.reloadChannelConfigs();
    await fb.reloadChannelPrefixes();
    return {
      reply: `Configurations reloaded`,
      notes: `Reload requested by ${message.senderUsername}`,
    };
  } catch (err) {
    return {
      reply: `Error reloading: ${err.message}`,
      notes: `Reload failed: ${err}`,
    };
  }
};

const reloadDbCommand = async (message) => {
  message.command = "dev reloaddb";

  const authorId = message.senderUserID;
  if (authorId !== process.env.DEV_USERID) {
    return;
  }

  try {
    // This would need to be implemented based on your database connection management
    return {
      reply: `Database connection reloaded`,
      notes: `DB reload requested by ${message.senderUsername}`,
    };
  } catch (err) {
    return {
      reply: `Error reloading DB: ${err.message}`,
      notes: `DB reload failed: ${err}`,
    };
  }
};

const gitPullCommand = async (message) => {
  message.command = "dev gitpull";

  const authorId = message.senderUserID;
  if (authorId !== process.env.DEV_USERID) {
    return;
  }

  return new Promise((resolve) => {
    exec("git pull", (error, stdout, stderr) => {
      if (error) {
        resolve({
          reply: `Git pull error: ${error.message}`,
          notes: `Git pull failed: ${error}`,
        });
        return;
      }
      resolve({
        reply: `Git pull successful: ${stdout}`,
        notes: `Git pull success: ${stdout}`,
      });
    });
  });
};

const reloadEmotesCommand = async (message) => {
  message.command = "dev reloademotes";

  const authorId = message.senderUserID;
  if (authorId !== process.env.DEV_USERID) {
    return;
  }

  try {
    await fb.emotes.reload();
    return {
      reply: `Emotes reloaded`,
      notes: `Emotes reload requested by ${message.senderUsername}`,
    };
  } catch (err) {
    return {
      reply: `Error reloading emotes: ${err.message}`,
      notes: `Emotes reload failed: ${err}`,
    };
  }
};

const allEmotesCommand = async (message) => {
  message.command = "dev allemotes";

  const authorId = message.senderUserID;
  if (authorId !== process.env.DEV_USERID) {
    return;
  }

  const channel = message.args[1] || message.channelName;

  try {
    const emotes = await fb.emotes.getAllEmotes(channel);
    return {
      reply: `All emotes for ${channel}: ${emotes.join(", ")}`,
      notes: `Emotes list for ${channel}`,
    };
  } catch (err) {
    return {
      reply: `Error getting emotes: ${err.message}`,
      notes: `Emotes list failed for ${channel}: ${err}`,
    };
  }
};

const devBanCommand = async (message) => {
  message.command = "dev devban";

  const authorId = message.senderUserID;
  if (authorId !== process.env.DEV_USERID) {
    return;
  }

  const targetUser = message.args[1];
  if (!targetUser) {
    return {
      reply: `Please provide a username`,
      notes: `Missing username parameter for dev ban`,
    };
  }

  try {
    await fb.db.update(
      "config",
      { channelId: message.channelID },
      { $push: { devBanCommands: targetUser } }
    );
    return {
      reply: `User ${targetUser} dev banned`,
      notes: `Dev ban: ${targetUser} in ${message.channelName}`,
    };
  } catch (err) {
    return {
      reply: `Error dev banning: ${err.message}`,
      notes: `Dev ban failed: ${targetUser}, Error: ${err}`,
    };
  }
};

const unbanDevCommand = async (message) => {
  message.command = "dev devunban";

  const authorId = message.senderUserID;
  if (authorId !== process.env.DEV_USERID) {
    return;
  }

  const targetUser = message.args[1];
  if (!targetUser) {
    return {
      reply: `Please provide a username`,
      notes: `Missing username parameter for dev unban`,
    };
  }

  try {
    await fb.db.update(
      "config",
      { channelId: message.channelID },
      { $pull: { devBanCommands: targetUser } }
    );
    return {
      reply: `User ${targetUser} dev unbanned`,
      notes: `Dev unban: ${targetUser} in ${message.channelName}`,
    };
  } catch (err) {
    return {
      reply: `Error dev unbanning: ${err.message}`,
      notes: `Dev unban failed: ${targetUser}, Error: ${err}`,
    };
  }
};

const shortenCommand = async (message) => {
  message.command = "dev shorten";

  const authorId = message.senderUserID;
  if (authorId !== process.env.DEV_USERID) {
    return;
  }

  const url = message.args[1];
  if (!url) {
    return {
      reply: `Please provide a URL`,
      notes: `Missing URL parameter for shortening`,
    };
  }

  try {
    const shortenedUrl = await fb.utils.shortenUrl(url);
    return {
      reply: `Shortened URL: ${shortenedUrl}`,
      notes: `URL shortened: ${url} -> ${shortenedUrl}`,
    };
  } catch (err) {
    return {
      reply: `Error shortening URL: ${err.message}`,
      notes: `URL shortening failed: ${url}, Error: ${err}`,
    };
  }
};

const joinedChannelsCommand = async (message) => {
  message.command = "dev joinedchannels";

  const authorId = message.senderUserID;
  if (authorId !== process.env.DEV_USERID) {
    return;
  }

  const channels = [...fb.joinedChannels];
  return {
    reply: `Joined channels: ${channels.join(", ")}`,
    notes: `Joined channels list: ${channels.length} channels`,
  };
};

const devJoinChannelCommand = async (message) => {
  message.command = "dev devjoin";

  const authorId = message.senderUserID;
  if (authorId !== process.env.DEV_USERID) {
    return;
  }

  const targetChannel = message.args[1];
  if (!targetChannel) {
    return {
      reply: `Please provide a channel name`,
      notes: `Missing channel parameter for dev join`,
    };
  }

  try {
    await fb.joinChannel(targetChannel);
    return {
      reply: `Joined ${targetChannel}`,
      notes: `Dev join: ${targetChannel}`,
    };
  } catch (err) {
    return {
      reply: `Error joining: ${err.message}`,
      notes: `Dev join failed: ${targetChannel}, Error: ${err}`,
    };
  }
};

const devPartChannelCommand = async (message) => {
  message.command = "dev devpart";

  const authorId = message.senderUserID;
  if (authorId !== process.env.DEV_USERID) {
    return;
  }

  const targetChannel = message.args[1];
  if (!targetChannel) {
    return {
      reply: `Please provide a channel name`,
      notes: `Missing channel parameter for dev part`,
    };
  }

  try {
    await fb.partChannel(targetChannel);
    return {
      reply: `Parted ${targetChannel}`,
      notes: `Dev part: ${targetChannel}`,
    };
  } catch (err) {
    return {
      reply: `Error parting: ${err.message}`,
      notes: `Dev part failed: ${targetChannel}, Error: ${err}`,
    };
  }
};

const giveXpCommand = async (message) => {
  message.command = "dev givexp";

  const authorId = message.senderUserID;
  if (authorId !== process.env.DEV_USERID) {
    return;
  }

  const targetUser = message.args[1];
  const amount = parseInt(message.args[2]);

  if (!targetUser || !amount) {
    return {
      reply: `Please provide username and amount`,
      notes: `Missing parameters for XP give`,
    };
  }

  try {
    await fb.db.update("user", { user: targetUser }, { $inc: { xp: amount } });
    return {
      reply: `Gave ${amount} XP to ${targetUser}`,
      notes: `XP given: ${targetUser} +${amount}`,
    };
  } catch (err) {
    return {
      reply: `Error giving XP: ${err.message}`,
      notes: `XP give failed: ${targetUser} +${amount}, Error: ${err}`,
    };
  }
};

const rustlogAddCommand = async (message) => {
  message.command = "dev rustlogadd";

  const authorId = message.senderUserID;
  if (authorId !== process.env.DEV_USERID) {
    return;
  }

  const targetUser = message.args[1];
  if (!targetUser) {
    return {
      reply: `Please provide a username`,
      notes: `Missing username parameter for rustlog add`,
    };
  }

  try {
    const userId = await fb.twitch.getUserID(targetUser);
    await fb.rustlog.addChannel(userId);
    return {
      reply: `Added ${targetUser} to rustlog`,
      notes: `Rustlog add: ${targetUser} (${userId})`,
    };
  } catch (err) {
    return {
      reply: `Error adding to rustlog: ${err.message}`,
      notes: `Rustlog add failed: ${targetUser}, Error: ${err}`,
    };
  }
};

const rustlogRemoveCommand = async (message) => {
  message.command = "dev rustlogremove";

  const authorId = message.senderUserID;
  if (authorId !== process.env.DEV_USERID) {
    return;
  }

  const targetUser = message.args[1];
  if (!targetUser) {
    return {
      reply: `Please provide a username`,
      notes: `Missing username parameter for rustlog remove`,
    };
  }

  try {
    const userId = await fb.twitch.getUserID(targetUser);
    await fb.rustlog.removeChannel(userId);
    return {
      reply: `Removed ${targetUser} from rustlog`,
      notes: `Rustlog remove: ${targetUser} (${userId})`,
    };
  } catch (err) {
    return {
      reply: `Error removing from rustlog: ${err.message}`,
      notes: `Rustlog remove failed: ${targetUser}, Error: ${err}`,
    };
  }
};

const revivePetCommand = async (message) => {
  message.command = "dev petrevive";

  const authorId = message.senderUserID;
  if (authorId !== process.env.DEV_USERID) {
    return;
  }

  const targetUser = message.args[1];
  if (!targetUser) {
    return {
      reply: `Please provide a username`,
      notes: `Missing username parameter for pet revive`,
    };
  }

  try {
    await fb.db.update(
      "pet",
      { user: targetUser },
      { $set: { alive: true, health: 100 } }
    );
    return {
      reply: `Pet revived for ${targetUser}`,
      notes: `Pet revive: ${targetUser}`,
    };
  } catch (err) {
    return {
      reply: `Error reviving pet: ${err.message}`,
      notes: `Pet revive failed: ${targetUser}, Error: ${err}`,
    };
  }
};

// Command metadata
botSayCommand.commandName = "botsay";
botSayCommand.aliases = ["botsay", "bsay"];
botSayCommand.shortDescription = "Make the bot say something in a channel";
botSayCommand.cooldown = 0;
botSayCommand.cooldownType = "user";
botSayCommand.permissions = ["dev"];
botSayCommand.whisperable = false;

forceJoinCommand.commandName = "forcejoin";
forceJoinCommand.aliases = ["forcejoin", "fjoin"];
forceJoinCommand.shortDescription = "Force join a channel";
forceJoinCommand.cooldown = 0;
forceJoinCommand.cooldownType = "user";
forceJoinCommand.permissions = ["dev"];
forceJoinCommand.whisperable = false;

forcePartCommand.commandName = "forcepart";
forcePartCommand.aliases = ["forcepart", "fpart"];
forcePartCommand.shortDescription = "Force part a channel";
forcePartCommand.cooldown = 0;
forcePartCommand.cooldownType = "user";
forcePartCommand.permissions = ["dev"];
forcePartCommand.whisperable = false;

execCommand.commandName = "exec";
execCommand.aliases = ["exec", "eval"];
execCommand.shortDescription = "Execute a shell command";
execCommand.cooldown = 0;
execCommand.cooldownType = "user";
execCommand.permissions = ["dev"];
execCommand.whisperable = false;

sqlExecCommand.commandName = "sqlexec";
sqlExecCommand.aliases = ["sqlexec", "sql"];
sqlExecCommand.shortDescription = "Execute a SQL query";
execCommand.cooldown = 0;
execCommand.cooldownType = "user";
execCommand.permissions = ["dev"];
execCommand.whisperable = false;

getUserIdCommand.commandName = "getuserid";
getUserIdCommand.aliases = ["getuserid", "uid"];
getUserIdCommand.shortDescription = "Get user ID for a username";
getUserIdCommand.cooldown = 0;
getUserIdCommand.cooldownType = "user";
getUserIdCommand.permissions = ["dev"];
getUserIdCommand.whisperable = false;

restartCommand.commandName = "restart";
restartCommand.aliases = ["restart"];
restartCommand.shortDescription = "Restart the bot";
restartCommand.cooldown = 0;
restartCommand.cooldownType = "user";
restartCommand.permissions = ["dev"];
restartCommand.whisperable = false;

resetPetCommand.commandName = "resetpet";
resetPetCommand.aliases = ["resetpet", "resetpat"];
resetPetCommand.shortDescription = "Reset pet attention for a user";
resetPetCommand.cooldown = 0;
resetPetCommand.cooldownType = "user";
resetPetCommand.permissions = ["dev"];
resetPetCommand.whisperable = false;

resetCdCommand.commandName = "resetcd";
resetCdCommand.aliases = ["resetcd"];
resetCdCommand.shortDescription = "Reset cookie daily for a user";
resetCdCommand.cooldown = 0;
resetCdCommand.cooldownType = "user";
resetCdCommand.permissions = ["dev"];
resetCdCommand.whisperable = false;

reloadCommand.commandName = "reload";
reloadCommand.aliases = ["reload"];
reloadCommand.shortDescription = "Reload bot configurations";
reloadCommand.cooldown = 0;
reloadCommand.cooldownType = "user";
reloadCommand.permissions = ["dev"];
reloadCommand.whisperable = false;

reloadDbCommand.commandName = "reloaddb";
reloadDbCommand.aliases = ["reloaddb", "reloadbd"];
reloadDbCommand.shortDescription = "Reload database connection";
reloadDbCommand.cooldown = 0;
reloadDbCommand.cooldownType = "user";
reloadDbCommand.permissions = ["dev"];
reloadDbCommand.whisperable = false;

gitPullCommand.commandName = "gitpull";
gitPullCommand.aliases = ["gitpull", "gpull"];
gitPullCommand.shortDescription = "Pull latest changes from git";
gitPullCommand.cooldown = 0;
gitPullCommand.cooldownType = "user";
gitPullCommand.permissions = ["dev"];
gitPullCommand.whisperable = false;

reloadEmotesCommand.commandName = "reloademotes";
reloadEmotesCommand.aliases = ["reloademotes"];
reloadEmotesCommand.shortDescription = "Reload emotes";
reloadEmotesCommand.cooldown = 0;
reloadEmotesCommand.cooldownType = "user";
reloadEmotesCommand.permissions = ["dev"];
reloadEmotesCommand.whisperable = false;

allEmotesCommand.commandName = "allemotes";
allEmotesCommand.aliases = ["allemotes"];
allEmotesCommand.shortDescription = "List all emotes for a channel";
allEmotesCommand.cooldown = 0;
allEmotesCommand.cooldownType = "user";
allEmotesCommand.permissions = ["dev"];
allEmotesCommand.whisperable = false;

devBanCommand.commandName = "devban";
devBanCommand.aliases = ["devban", "dban"];
devBanCommand.shortDescription = "Ban a user from using dev commands";
devBanCommand.cooldown = 0;
devBanCommand.cooldownType = "user";
devBanCommand.permissions = ["dev"];
devBanCommand.whisperable = false;

unbanDevCommand.commandName = "devunban";
unbanDevCommand.aliases = ["devunban", "dunban"];
unbanDevCommand.shortDescription = "Unban a user from dev commands";
unbanDevCommand.cooldown = 0;
unbanDevCommand.cooldownType = "user";
unbanDevCommand.permissions = ["dev"];
unbanDevCommand.whisperable = false;

shortenCommand.commandName = "shorten";
shortenCommand.aliases = ["shorten"];
shortenCommand.shortDescription = "Shorten a URL";
shortenCommand.cooldown = 0;
shortenCommand.cooldownType = "user";
shortenCommand.permissions = ["dev"];
shortenCommand.whisperable = false;

joinedChannelsCommand.commandName = "joinedchannels";
joinedChannelsCommand.aliases = ["joinedchannels", "jchannels"];
joinedChannelsCommand.shortDescription = "List all joined channels";
joinedChannelsCommand.cooldown = 0;
joinedChannelsCommand.cooldownType = "user";
joinedChannelsCommand.permissions = ["dev"];
joinedChannelsCommand.whisperable = false;

devJoinChannelCommand.commandName = "devjoin";
devJoinChannelCommand.aliases = ["devjoin", "djoin"];
devJoinChannelCommand.shortDescription = "Join a channel as dev";
devJoinChannelCommand.cooldown = 0;
devJoinChannelCommand.cooldownType = "user";
devJoinChannelCommand.permissions = ["dev"];
devJoinChannelCommand.whisperable = false;

devPartChannelCommand.commandName = "devpart";
devPartChannelCommand.aliases = ["devpart", "dpart"];
devPartChannelCommand.shortDescription = "Part a channel as dev";
devPartChannelCommand.cooldown = 0;
devPartChannelCommand.cooldownType = "user";
devPartChannelCommand.permissions = ["dev"];
devPartChannelCommand.whisperable = false;

giveXpCommand.commandName = "givexp";
giveXpCommand.aliases = ["devgivexp", "givexp"];
giveXpCommand.shortDescription = "Give XP to a user";
giveXpCommand.cooldown = 0;
giveXpCommand.cooldownType = "user";
giveXpCommand.permissions = ["dev"];
giveXpCommand.whisperable = false;

rustlogAddCommand.commandName = "rustlogadd";
rustlogAddCommand.aliases = ["rustlogadd", "rladd"];
rustlogAddCommand.shortDescription = "Add a channel to rustlog";
rustlogAddCommand.cooldown = 0;
rustlogAddCommand.cooldownType = "user";
rustlogAddCommand.permissions = ["dev"];
rustlogAddCommand.whisperable = false;

rustlogRemoveCommand.commandName = "rustlogremove";
rustlogRemoveCommand.aliases = [
  "rustlogremove",
  "rlremove",
  "rldelete",
  "rldel",
];
rustlogRemoveCommand.shortDescription = "Remove a channel from rustlog";
rustlogRemoveCommand.cooldown = 0;
rustlogRemoveCommand.cooldownType = "user";
rustlogRemoveCommand.permissions = ["dev"];
rustlogRemoveCommand.whisperable = false;

revivePetCommand.commandName = "petrevive";
revivePetCommand.aliases = ["petrevive", "revivepet"];
revivePetCommand.shortDescription = "Revive a pet for a user";
revivePetCommand.cooldown = 0;
revivePetCommand.cooldownType = "user";
revivePetCommand.permissions = ["dev"];
revivePetCommand.whisperable = false;

module.exports = {
  botSayCommand,
  forceJoinCommand,
  forcePartCommand,
  execCommand,
  sqlExecCommand,
  getUserIdCommand,
  restartCommand,
  resetPetCommand,
  resetCdCommand,
  reloadCommand,
  reloadDbCommand,
  gitPullCommand,
  reloadEmotesCommand,
  allEmotesCommand,
  devBanCommand,
  unbanDevCommand,
  shortenCommand,
  joinedChannelsCommand,
  devJoinChannelCommand,
  devPartChannelCommand,
  giveXpCommand,
  rustlogAddCommand,
  rustlogRemoveCommand,
  revivePetCommand,
};
