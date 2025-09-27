const path = require("path");
const Uwuifier = require("uwuifier").default;

const uwuifier = new Uwuifier();

const uwuCommand = async (message) => {
  const textToUwuify = message.args.slice(1).join(" ");
  if (!textToUwuify) {
    return {
      reply: `Use o formato: ${message.prefix}uwu <mensagem>`,
    };
  }

  const uwuifiedText = uwuifier.uwuifySentence(textToUwuify);

  return {
    reply: `🤖 ${uwuifiedText}`,
  };
};

uwuCommand.commandName = "uwu";
uwuCommand.aliases = ["uwu", "uwuify"];
uwuCommand.shortDescription = "Uwuifique uma mensagem";
uwuCommand.cooldown = 5000;
uwuCommand.cooldownType = "channel";
uwuCommand.whisperable = true;
uwuCommand.description = `Uwuifique uma mensagem`;
uwuCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/src/commands/${__dirname.split(path.sep).pop()}/${__filename.split(path.sep).pop()}`;

module.exports = {
  testeCommand: uwuCommand,
};
