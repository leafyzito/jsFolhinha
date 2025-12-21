module.exports = async function handleChannelSubscriptionGift(event) {
  try {
    const broadcasterId = event.broadcasterId;
    const broadcasterName = event.broadcasterDisplayName || "Unknown";
    const broadcasterLogin =
      event.broadcasterUserLogin || broadcasterName.toLowerCase();
    const gifterDisplayName = event.gifterDisplayName || "Unknown";
    const amount = event.amount || 0;

    // Check if we should send a thanking message
    const channelConfig = await fb.db.get("config", {
      channelId: broadcasterId,
    });

    if (channelConfig && channelConfig.thankSubs && !channelConfig.isPaused) {
      const emote = await fb.emotes.getEmoteFromList(
        broadcasterLogin,
        fb.emotes.loveEmotes,
        "💚"
      );
      fb.log.send(
        broadcasterLogin,
        `Obrigado pelos ${amount} sub gift(s), ${gifterDisplayName}! ${emote}`
      );
    }
  } catch (error) {
    console.log(error);
    fb.discord.logError(
      `Error handling channel subscription gift event: ${error.message}`
    );
  }
};
