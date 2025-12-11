const joinedChannelsCommand = async () => {
  return {
    reply: `🤖 ${fb.twitch.anonClient.currentChannels.length}/${fb.twitch.anonClient.channelsToJoin.length}`,
  };
};

// Command metadata
joinedChannelsCommand.commandName = "joinedchannels";
joinedChannelsCommand.aliases = ["joinedchannels", "jchannels"];
joinedChannelsCommand.shortDescription =
  "[DEV] Mostra quantidade de canais conectados";
joinedChannelsCommand.cooldown = 5_000;
joinedChannelsCommand.cooldownType = "user";
joinedChannelsCommand.permissions = ["admin"];
joinedChannelsCommand.whisperable = false;
joinedChannelsCommand.flags = ["dev"];
joinedChannelsCommand.description = `Exibe quantos canais o bot está conectado atualmente`;

module.exports = { joinedChannelsCommand };
