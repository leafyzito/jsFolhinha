const allEmotesCommand = async (message) => {
  message.command = "dev allemotes";

  const targetChannel =
    message.messageText.split(" ")[1] || message.channelName;
  const channelEmotes = await fb.emotes.getChannelEmotes(targetChannel);
  fb.log.reply(message, `${channelEmotes.length} emotes no total`);

  // send all emotes in chunks of 490 characters
  let emoteMessage = "";
  for (let i = 0; i < channelEmotes.length; i++) {
    if ((emoteMessage + ` ${channelEmotes[i]} `).length > 490) {
      fb.log.send(message.channelName, emoteMessage);
      emoteMessage = "";
    }
    emoteMessage += ` ${channelEmotes[i]} `;
  }
  if (emoteMessage.length > 0) {
    fb.log.send(message.channelName, emoteMessage);
  }
};

// Command metadata
allEmotesCommand.commandName = "allemotes";
allEmotesCommand.aliases = ["allemotes"];
allEmotesCommand.shortDescription = "List all emotes for a channel";
allEmotesCommand.cooldown = 5_000;
allEmotesCommand.cooldownType = "user";
allEmotesCommand.permissions = ["admin"];
allEmotesCommand.whisperable = false;

module.exports = { allEmotesCommand };
