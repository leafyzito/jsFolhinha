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
reloadEmotesCommand.shortDescription = "[DEV] Recarrega os emotes dos canais";
reloadEmotesCommand.cooldown = 5_000;
reloadEmotesCommand.cooldownType = "user";
reloadEmotesCommand.permissions = ["admin"];
reloadEmotesCommand.whisperable = false;
reloadEmotesCommand.flags = ["dev"];
reloadEmotesCommand.description = `Recarrega a lista de emotes para um canal específico, para todos os canais em cache, ou limpa toda a cache de emotes

• Exemplo: !reloademotes - Recarrega os emotes do canal atual
• Exemplo: !reloademotes canal123 - Recarrega os emotes do canal "canal123"
• Exemplo: !reloademotes all - Recarrega os emotes de todos os canais em cache
• Exemplo: !reloademotes clear - Limpa toda a cache de emotes`;

module.exports = { reloadEmotesCommand };
