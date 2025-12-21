module.exports = async function handleChannelSubscription(event) {
  try {
    const broadcasterId = event.broadcasterId;
    const broadcasterName = event.broadcasterDisplayName || "Unknown";
    const broadcasterLogin =
      event.broadcasterUserLogin || broadcasterName.toLowerCase();
    const userDisplayName = event.userDisplayName || "Unknown";
    const isGift = event.isGift || false;
    const gifterDisplayName = event.gifterDisplayName || null;

    // Check if this is a resubscription by looking for cumulativeMonths or durationMonths
    const durationMonths = event.durationMonths;
    const cumulativeMonths = event.cumulativeMonths;
    const isResubscription =
      cumulativeMonths !== undefined || durationMonths !== undefined;

    // Check if we should send a thanking message
    const channelConfig = await fb.db.get("config", {
      channelId: broadcasterId,
    });

    if (channelConfig && channelConfig.thankSubs && !channelConfig.isPaused) {
      if (isGift && gifterDisplayName) {
        // For gifted subs, thank the gifter
        fb.log.send(
          broadcasterLogin,
          `Obrigado pelo gift sub, ${gifterDisplayName}! 💚`
        );
      } else if (isResubscription) {
        // For resubs, thank the user
        const months = cumulativeMonths || durationMonths || 1;
        fb.log.send(
          broadcasterLogin,
          `Obrigado pelos ${months} mês(es) de sub, ${userDisplayName}! 💚`
        );
      } else {
        // For new subs, thank the user
        const emote = await fb.emotes.getEmoteFromList(
          broadcasterLogin,
          fb.emotes.loveEmotes,
          "💚"
        );
        fb.log.send(
          broadcasterLogin,
          `Obrigado pelo sub, ${userDisplayName}! ${emote}`
        );
      }
    }
  } catch (error) {
    console.log(error);
    fb.discord.logError(
      `Error handling channel subscription event: ${error.message}`
    );
  }
};
