module.exports = function onClearChat(message) {
  if (message.targetUsername === process.env.BOT_USERNAME) {
    fb.discord.importantLog(
      `* ${
        message.isTimeout()
          ? `Tomei timeout em #${message.channelName} por ${message.banDuration} segundos`
          : `Fui banido em #${message.channelName}`
      }`
    );
  }
};
