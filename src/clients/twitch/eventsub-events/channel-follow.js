module.exports = async function handleChannelFollow(event) {
  try {
    const broadcasterId = event.broadcasterId;
    const broadcasterName = event.broadcasterDisplayName || "Unknown";
    const broadcasterLogin =
      event.broadcasterUserLogin || broadcasterName.toLowerCase();
    const userDisplayName = event.userDisplayName || "Unknown";

    // Check if we should send a thanking message
    const channelConfig = await fb.db.get("config", {
      channelId: broadcasterId,
    });

    if (
      channelConfig &&
      channelConfig.thankFollows &&
      !channelConfig.isPaused
    ) {
      const emote = await fb.emotes.getEmoteFromList(
        broadcasterLogin,
        fb.emotes.loveEmotes,
        "💚"
      );
      fb.log.send(
        broadcasterLogin,
        `Obrigado pelo follow, ${userDisplayName}! ${emote}`
      );
    }
  } catch (error) {
    console.log(error);
    fb.discord.logError(
      `Error handling channel follow event: ${error.message}`
    );
  }
};
