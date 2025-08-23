const percentagemCommand = async () => {
  const randomPercentage = (Math.random() * 100).toFixed(2);

  return {
    reply: `${randomPercentage}%`,
  };
};

percentagemCommand.commandName = "%";
percentagemCommand.aliases = ["percentagem", "%"];
percentagemCommand.shortDescription = "Mostra uma percentagem aleatória";
percentagemCommand.cooldown = 5000;
percentagemCommand.cooldownType = "channel";
percentagemCommand.whisperable = true;
percentagemCommand.description =
  "Uso: !% <quantidade>; Resposta esperada: {percentagem aleatória}";
percentagemCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/src/commands/${__dirname
  .split("/")
  .pop()}/${__filename.split("/").pop()}`;

module.exports = {
  percentagemCommand,
};
