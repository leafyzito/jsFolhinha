const { commandHandler } = require("../../../handlers");

module.exports = function onWhisper(message) {
  message.commandPrefix = "!";
  message.internalTimestamp = new Date().getTime();
  message.serverTimestamp = new Date();
  message.serverTimestampRaw = new Date().getTime();
  message.channelName = "whisper";
  message.isWhisper = true;

  const validPrefixes = [
    "?",
    "&",
    "%",
    "+",
    "*",
    "-",
    "=",
    "|",
    "@",
    "#",
    "$",
    "~",
    "\\",
    "_",
    ",",
    ";",
    "<",
    ">",
  ];
  for (const prefix of validPrefixes) {
    if (message.messageText.startsWith(prefix)) {
      message.messageText = message.messageText.replace(
        prefix,
        message.commandPrefix
      );
    }
  }

  if (process.env.ENV == "prod") {
    commandHandler(message);
  }
  if (!message.messageText.startsWith(message.commandPrefix)) {
    fb.discord.logWhisperFrom(message);
  }
};
