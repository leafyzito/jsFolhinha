module.exports = async function handleStreamOnline(event, liveChannels) {
  try {
    const broadcasterId = event.broadcasterId;
    const broadcasterName = event.broadcasterDisplayName;
    const broadcasterLogin =
      event.broadcasterUserLogin || broadcasterName.toLowerCase();
    const startedAt = event.startedAt ? new Date(event.startedAt) : new Date();

    // Store live status
    liveChannels.set(broadcasterId, {
      channelId: broadcasterId,
      channelName: broadcasterLogin,
      displayName: broadcasterName,
      isLive: true,
      startedAt: startedAt,
    });

    // Check if offlineOnly is enabled and bot is not paused
    const channelConfig = await fb.db.get("config", {
      channelId: broadcasterId,
    });

    if (channelConfig && channelConfig.offlineOnly && !channelConfig.isPaused) {
      const happyEmote = await fb.emotes.getEmoteFromList(
        broadcasterLogin,
        fb.emotes.happyEmotes,
        "😊",
      );
      fb.log.send(
        broadcasterLogin,
        `🔴 Live começando! Bot pausado para não interferir. Boa live! ${happyEmote}`,
      );
    }

    fb.discord.log(`* ${broadcasterName} went live`);
  } catch (error) {
    console.log(error);
    fb.discord.logError(`Error handling stream online event: ${error.message}`);
  }
};
