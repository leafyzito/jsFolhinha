const joinedChannelsCommand = async (message) => {
  message.command = "dev joinedchannels";

  return {
    reply: `🤖 ${[...fb.twitch.anonClient.joinedChannels].length}/${
      fb.twitch.anonClient.channelsToJoin.length
    }`,
  };
};

// Command metadata
joinedChannelsCommand.commandName = "joinedchannels";
joinedChannelsCommand.aliases = ["joinedchannels", "jchannels"];
joinedChannelsCommand.shortDescription = "List all joined channels";
joinedChannelsCommand.cooldown = 5_000;
joinedChannelsCommand.cooldownType = "user";
joinedChannelsCommand.permissions = ["admin"];
joinedChannelsCommand.whisperable = false;

module.exports = { joinedChannelsCommand };
