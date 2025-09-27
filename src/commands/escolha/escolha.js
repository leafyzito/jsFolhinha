const path = require("path");
const escolhaCommand = async (message) => {
  let args = message.args.slice(1);

  // Filter out "ou" and "or" words
  args = args.filter(
    (arg) => arg.toLowerCase() !== "ou" && arg.toLowerCase() !== "or"
  );

  if (args.length < 2) {
    return {
      reply: `Intruduza pelo menos 2 elementos pra serem escolhidos`,
    };
  }

  const choice = fb.utils.randomChoice(args.slice(0, args.length));
  return {
    reply: `🤖 ${choice}`,
  };
};

escolhaCommand.commandName = "escolha";
escolhaCommand.aliases = ["escolha", "escolher", "choose", "choice", "pick"];
escolhaCommand.shortDescription =
  "Faça o bot escolher um elemento aleatório de uma lista";
escolhaCommand.cooldown = 5000;
escolhaCommand.cooldownType = "channel";
escolhaCommand.whisperable = true;
escolhaCommand.description = `Faça o Folhinha escolher entre as escolhas que você fornecer
• Exemplo: !escolha a b c - O bot vai escolher um dos três itens aleatoriamente`;
escolhaCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/src/commands/${__dirname.split(path.sep).pop()}/${__filename.split(path.sep).pop()}`;

module.exports = {
  escolhaCommand,
};
