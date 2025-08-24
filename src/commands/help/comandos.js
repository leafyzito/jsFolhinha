const comandosCommand = async () => {
  return {
    reply: `Para uma lista de comandos acesse https://folhinhabot.com/comandos`,
  };
};

comandosCommand.commandName = "comandos";
comandosCommand.aliases = ["comandos", "commands", "comando", "command"];
comandosCommand.shortDescription = "Veja os comandos disponíveis no bot";
comandosCommand.cooldown = 5000;
comandosCommand.cooldownType = "channel";
comandosCommand.whisperable = true;
comandosCommand.description =
  "Apenas um comando para direcionar o usuário para a página de comandos do bot";
comandosCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/src/commands/${__dirname
  .split("/")
  .pop()}/${__filename.split("/").pop()}`;

module.exports = { comandosCommand };
