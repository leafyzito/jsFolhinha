const rolarCommand = async (message) => {
  if (message.args.length === 1) {
    return {
      reply: `Use o formato: ${message.prefix}rolar <quantos dados> <de quantos lados>`,
    };
  }

  const commandArgs = message.args.slice(1);
  let [diceCount, diceSides] = commandArgs;

  // Handle "XdY" format (e.g., "6d10")
  if (diceCount.includes("d")) {
    const parts = diceCount.split("d");
    diceCount = parts[0];
    diceSides = parts[1];
  } else {
    // Remove any 'd' characters from sides argument
    diceSides = diceSides?.replace(/d/g, "");
  }

  // Validate input parameters
  if (!diceCount || !diceSides) {
    return {
      reply: `Use o formato: ${message.prefix}rolar <quantos dados> <de quantos lados>`,
    };
  }

  const numDice = parseInt(diceCount);
  const numSides = parseInt(diceSides);

  // Check if parameters are valid numbers
  if (isNaN(numDice) || isNaN(numSides) || numDice < 1 || numSides < 1) {
    return {
      reply: `Use o formato: ${message.prefix}rolar <quantos dados> <de quantos lados>`,
    };
  }

  // Check limits
  if (numDice > 10 || numSides > 100) {
    return {
      reply: `O máximo de dados é 10 e o máximo de lados é 100`,
    };
  }

  // Roll the dice
  const diceResults = [];
  for (let i = 0; i < numDice; i++) {
    diceResults.push(fb.utils.randomInt(1, numSides));
  }

  // Sort results in ascending order
  diceResults.sort((a, b) => a - b);

  // Calculate sum if multiple dice
  const totalSum = diceResults.reduce((sum, result) => sum + result, 0);

  // Build response message
  const isSingleDie = diceResults.length === 1;
  const responseText = isSingleDie
    ? "A sua rolada foi:"
    : "As suas roladas foram:";

  const resultsText = diceResults.join(", ");
  const sumText = isSingleDie ? "" : ` (soma: ${totalSum})`;

  return {
    reply: `${responseText} ${resultsText}${sumText} 🎲`,
  };
};

rolarCommand.commandName = "rolar";
rolarCommand.aliases = ["rolar", "roll"];
rolarCommand.shortDescription = "Lance um ou mais dados";
rolarCommand.cooldown = 5000;
rolarCommand.cooldownType = "channel";
rolarCommand.whisperable = true;
rolarCommand.description = `Lance até 10 dados com quantos lados você quiser, com limite de 100 lados
• Exemplo: !rolar 2 10 - O bot irá lançar 2 dados de 10 lados
• Exemplo: !rolar 6d10 - O bot irá lançar 6 dados de 10 lados`;
rolarCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/src/commands/${__dirname
  .split("/")
  .pop()}/${__filename.split("/").pop()}`;

module.exports = {
  rolarCommand,
};
