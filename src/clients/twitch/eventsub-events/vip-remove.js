module.exports = async function handleVipRemove(event) {
  try {
    const broadcasterId = event.broadcasterId;
    const userId = event.userId;
    const botUserId = process.env.BOT_USERID;

    // Only update if the bot was removed as VIP
    if (userId === botUserId) {
      await fb.db.update(
        "config",
        { channelId: broadcasterId },
        { $set: { botIsVip: false } }
      );

      fb.discord.importantLog(
        `* Bot was removed as VIP in channel ${broadcasterId}`
      );
    }
  } catch (err) {
    console.log(err);
    fb.discord.logError(`Error handling VIP remove event: ${err.message}`);
  }
};
