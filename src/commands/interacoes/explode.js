const path = require("path");
const explodeCommand = async (message) => {
  if (message.args.length === 1) {
    return {
      reply: `Use o formato: ${message.prefix}explode <pessoa pra explodir>`,
    };
  }

  const explodeTarget = message.args[1].replace(/^@/, "");

  if (explodeTarget.toLowerCase() === message.senderUsername) {
    const emote = await fb.emotes.getEmoteFromList(
      message.channelName,
      ["leledacuca", "biruta", "eeeh", "peepopiolho"],
      "💥🤨"
    );
    return {
      reply: `Você explodiu a si mesmo ${emote}`,
    };
  }

  if (["folhinha", "folhinhabot"].includes(explodeTarget.toLowerCase())) {
    return {
      reply: `MrDestructoid Boa tentativa, mas eu sou indestrutível`,
    };
  }

  const explosions = [
    `${message.senderUsername} explodiu ${explodeTarget} 💥`,
    `${message.senderUsername} explodiu ${explodeTarget} em pedacinhos 💥`,
    `${message.senderUsername} jogou um bomba em ${explodeTarget} 💣💥`,
    `${message.senderUsername} jogou uma dinamite em ${explodeTarget} 🧨💥`,
  ];

  return {
    reply: fb.utils.randomChoice(explosions),
  };
};

explodeCommand.commandName = "explode";
explodeCommand.aliases = ["explode", "explodir", "bomb"];
explodeCommand.shortDescription = "Explode alguém no chat";
explodeCommand.cooldown = 5000;
explodeCommand.cooldownType = "channel";
explodeCommand.whisperable = true;
explodeCommand.description = `Exploda virtualmente alguém do chat
• Exemplo: !explode @pessoa`;
explodeCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/src/commands/${__dirname.split(path.sep).pop()}/${__filename.split(path.sep).pop()}`;

module.exports = { explodeCommand };
