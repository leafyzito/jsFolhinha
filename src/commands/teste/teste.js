const testeCommand = async () => {
  return {
    replyType: "reply",
    reply: "testado 4",
    notes: "notes test",
  };
};

testeCommand.commandName = "teste";
testeCommand.aliases = ["teste", "test", "testing"];
testeCommand.shortDescription = "Comando para verificar se o bot está vivo";
testeCommand.cooldown = 5000;
testeCommand.cooldownType = "channel";
testeCommand.whisperable = true;
testeCommand.description = `Use para verificar se o Folhinha ainda está presente entre nós. Caso ele não responda, infelizmente ele se foi.`;
testeCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/src/commands/${__dirname
  .split("/")
  .pop()}/${__filename.split("/").pop()}`;

module.exports = {
  testeCommand,
};
