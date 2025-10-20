module.exports = function onTimeout(channel, user, duration) {
  if (user === process.env.BOT_USERNAME) {
    fb.discord.importantLog(
      `* ${
        duration != null
          ? `Tomei timeout em #${channel} por ${duration} segundos`
          : `Fui banido em #${channel}`
      }`
    );
  }
};
