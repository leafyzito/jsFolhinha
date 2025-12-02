const path = require("path");
const wrappedCommand = async (message) => {
  const emote = await fb.emotes.getEmoteFromList(
    message.channelName,
    fb.emotes.pogEmotes,
    "PogChamp"
  );

  return {
    reply: `${emote} Veja o seu Wrapped do Folhinha aqui: https://folhinhabot.com/wrapped/${message.senderUsername}`,
  };
};

wrappedCommand.commandName = "wrapped";
wrappedCommand.aliases = ["wrapped"];
wrappedCommand.shortDescription = "Veja o seu Wrapped do Folhinha";
wrappedCommand.cooldown = 5000;
wrappedCommand.cooldownType = "user";
wrappedCommand.whisperable = true;
wrappedCommand.description = `Veja algumas estatísticas sobre você e o bot durante 2025`;
wrappedCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/src/commands/${__dirname
  .split(path.sep)
  .pop()}/${__filename.split(path.sep).pop()}`;

module.exports = {
  wrappedCommand,
};
