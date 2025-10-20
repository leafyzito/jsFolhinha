const joinedChannelsCommand = async () => {
  return {
    reply: `🤖 ${fb.twitch.anonClient.currentChannels.length}/${
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
joinedChannelsCommand.flags = ["dev"];

module.exports = { joinedChannelsCommand };
