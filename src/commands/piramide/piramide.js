const path = require("path");

const generatePiramide = (altura, texto) => {
  const rows = [];
  // Go up to the peak
  for (let i = 0; i < altura; i++) {
    rows.push(
      Array(i + 1)
        .fill(texto)
        .join(" ")
    );
  }
  // Go back down from peak-1 to 1
  for (let i = altura - 1; i > 0; i--) {
    rows.push(Array(i).fill(texto).join(" "));
  }
  return { rows };
};

const piramideCommand = async (message) => {
  if (message.args.length < 2) {
    return {
      reply: `Use o formato: ${message.prefix}piramide <altura> <texto>`,
    };
  }

  const altura = parseInt(message.args[1], 10);
  const texto = message.args.slice(2).join(" ").trim();

  if (isNaN(altura) || altura < 1) {
    return {
      reply: `Use o formato: ${message.prefix}piramide <altura> <texto>`,
    };
  }

  if (!texto) {
    return {
      reply: `Use o formato: ${message.prefix}piramide <altura> <texto>`,
    };
  }

  let finalHeight = altura;
  const highestPointCharCount = texto.length * altura;

  if (highestPointCharCount > 490) {
    // calculate what would be the highest height for given text
    finalHeight = Math.floor(490 / texto.length);
    if (finalHeight < 1) {
      return {
        reply: `O texto fornecido é muito longo para criar uma pirâmide`,
      };
    }
  }

  const { rows } = generatePiramide(finalHeight, texto);

  for (const row of rows) {
    await fb.twitch.client.irc.say(`#${message.channelName}`, row);
  }
};

piramideCommand.commandName = "piramide";
piramideCommand.aliases = ["piramide", "pyramid"];
piramideCommand.shortDescription = "Cria uma pirâmide de texto";
piramideCommand.cooldown = 10_000;
piramideCommand.cooldownType = "channel";
piramideCommand.permissions = ["vip", "mod"];
piramideCommand.flags = ["vipBot", "modBot"];
piramideCommand.whisperable = false;
piramideCommand.description = `Cria uma pirâmide de texto com a altura especificada
• Exemplo: !piramide 5 Kappa - Cria uma pirâmide com 5 de altura de "Kappa"`;
piramideCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/src/commands/${__dirname
  .split(path.sep)
  .pop()}/${__filename.split(path.sep).pop()}`;

module.exports = {
  piramideCommand,
};
