const reloadEmotesCommand = async (message) => {
  const targetChannel =
    message.args[1]?.toLowerCase() || message.channelName.toLowerCase();

  if (targetChannel === "all") {
    const channelsToReload = Object.keys(fb.emotes.cachedEmotes);
    for (const channel of channelsToReload) {
      fb.emotes.cachedEmotes[channel] = null;
      await fb.emotes.getChannelEmotes(channel);
    }

    return {
      reply: `Emotes recarregados em ${channelsToReload.length} canais 👍`,
    };
  }

  if (targetChannel === "clear") {
    fb.emotes.cachedEmotes = {};
    return {
      reply: `Emotes limpos 👍`,
    };
  }
  fb.emotes.cachedEmotes[targetChannel] = null;
  await fb.emotes.getChannelEmotes(targetChannel);

  return {
    reply: `Emotes recarregados 👍`,
  };
};

// Command metadata
reloadEmotesCommand.commandName = "reloademotes";
reloadEmotesCommand.aliases = ["reloademotes"];
reloadEmotesCommand.shortDescription = "Reload emotes";
reloadEmotesCommand.cooldown = 5_000;
reloadEmotesCommand.cooldownType = "user";
reloadEmotesCommand.permissions = ["admin"];
reloadEmotesCommand.whisperable = false;
reloadEmotesCommand.flags = ["dev"];

module.exports = { reloadEmotesCommand };
