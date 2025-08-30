module.exports = function onTimeout(message, ban = false) {
  if (message.user === process.env.BOT_USERNAME) {
    fb.discord.importantLog(
      `* ${
        ban
          ? `Tomei timeout em #${message.channel} por ${message.duration} segundos`
          : `Fui banido em #${message.channel}`
      }`
    );
  }
};
