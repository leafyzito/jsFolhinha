const fillCommand = async (message) => {
  if (message.args.length < 2) {
    return {
      reply: `Use o formato: ${message.prefix}fill <mensagem>`,
    };
  }

  const maxLength = 499;
  let textToRepeat = message.args.slice(1).join(" ").trim();

  textToRepeat = fb.utils.sanitizeOtherPrefixes(textToRepeat);
  textToRepeat = textToRepeat.slice(0, maxLength);

  let finalText = "";
  while (finalText.length < maxLength) {
    finalText += textToRepeat + " ";
  }

  finalText = finalText.slice(0, maxLength);

  return {
    reply: finalText,
  };
};

fillCommand.commandName = "fill";
fillCommand.aliases = ["fill"];
fillCommand.shortDescription =
  "Faça o bot enviar uma mensagem cheia do que você quiser";
fillCommand.cooldown = 5000;
fillCommand.cooldownType = "channel";
fillCommand.whisperable = true;
fillCommand.description = `O bot vai repetir o que você fornecer até que o limite de caracteres seja atingido (500)

• Exemplo: !fill OMEGALUL - O bot vai repetir OMEGALUL até que o limite de caracteres seja atingido`;
fillCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/src/commands/${__dirname
  .split("/")
  .pop()}/${__filename.split("/").pop()}`;

module.exports = {
  fillCommand,
};
