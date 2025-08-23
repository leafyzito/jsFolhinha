const fs = require("fs");
const path = require("path");

const Piadas = fs.readFileSync(path.join(__dirname, "piadas.txt"), "utf8");

const piadaCommand = async (message) => {
  const totalJokes = Piadas.split("\n").length - 1;
  const specificPiadaIndex = message.args[1] ? parseInt(message.args[1]) : null;

  let piadaRes = specificPiadaIndex
    ? Piadas.split("\n")[specificPiadaIndex - 1]
    : fb.utils.randomChoice(Piadas.split("\n"));

  if (specificPiadaIndex) {
    if (specificPiadaIndex < 1 || specificPiadaIndex > totalJokes) {
      piadaRes = `Escolha um número entre 1 e ${totalJokes} para escolher uma piada específica`;
    }
  }

  // remove \n and \r from piadaRes
  piadaRes = piadaRes.replace(/(\r\n|\n|\r)/gm, " ");
  const jokeIndex = specificPiadaIndex
    ? specificPiadaIndex
    : Piadas.split("\n").indexOf(piadaRes) + 1;
  piadaRes = `#${jokeIndex}/${totalJokes} - ${piadaRes}`;

  return {
    reply: piadaRes,
  };
};

piadaCommand.commandName = "piada";
piadaCommand.aliases = ["piada", "joke", "piadas", "jokes"];
piadaCommand.shortDescription = "Mostra uma piada aleatória";
piadaCommand.cooldown = 5000;
piadaCommand.cooldownType = "channel";
piadaCommand.whisperable = true;
piadaCommand.description = `Veja uma piada aleatória ou específica quando determinado um número da lista de piadas

• Exemplo: "!piada - O bot vai enviar uma piada aleatória
• Exemplo: "!piada 4 - O bot vai enviar a piada número 4 da lista de piadas`;
piadaCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/src/commands/${__dirname
  .split("/")
  .pop()}/${__filename.split("/").pop()}`;

module.exports = {
  piadaCommand,
};
