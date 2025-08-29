const helpCommand = async (message) => {
  const specificCommand = message.args[1]?.toLowerCase();

  if (!specificCommand) {
    const emote = await fb.emotes.getEmoteFromList(
      message.channelName,
      fb.emotes.happyEmotes,
      "peepoHappy"
    );

    return {
      reply: `Para informações sobre o bot, acesse https://folhinhabot.com/ ${emote} Para ver infomações sobre um comando específico, use ${message.prefix}help <comando>`,
    };
  }

  if (!(specificCommand in fb.commandsList)) {
    return {
      reply: `O comando ${specificCommand} não existe. Para uma lista de comandos, acesse https://folhinhabot.com/comandos`,
    };
  }

  const commandInfo = fb.commandsList[specificCommand];
  const shortDescription = commandInfo.shortDescription;

  return {
    reply: `${fb.utils.capitalize(
      commandInfo.commandName
    )}: ${shortDescription} - https://folhinhabot.com/comandos/${encodeURIComponent(
      commandInfo.commandName
    )}`,
  };
};

helpCommand.commandName = "help";
helpCommand.aliases = ["help", "ajuda", "info"];
helpCommand.shortDescription = "Mostra um link para o site do bot";
helpCommand.cooldown = 5000;
helpCommand.cooldownType = "channel";
helpCommand.whisperable = true;
helpCommand.description =
  "Apenas um comando para direcionar o usuário para a página do bot";
helpCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/src/commands/${__dirname
  .split("/")
  .pop()}/${__filename.split("/").pop()}`;

module.exports = { helpCommand };
