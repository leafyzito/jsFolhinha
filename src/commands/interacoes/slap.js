const path = require("path");
const slapCommand = async (message) => {
  if (message.args.length === 1) {
    return {
      reply: `Use o formato: ${message.prefix}slap <pessoa pra dar um tapa>`,
    };
  }

  const slapTarget = message.args[1].replace(/^@/, "");

  if (slapTarget.toLowerCase() === message.senderUsername) {
    const emote = await fb.emotes.getEmoteFromList(
      message.channelName,
      ["leledacuca", "biruta", "eeeh", "peepopiolho"],
      "🤨",
    );
    return {
      reply: `Você deu um tapa em si mesmo ${emote}`,
    };
  }

  if (["folhinha", "folhinhabot"].includes(slapTarget.toLowerCase())) {
    return {
      reply: `MrDestructoid Por que você me bateu? Isso terá volta. Dorme de olho aberto, fique atento.`,
    };
  }

  const emote = await fb.emotes.getEmoteFromList(
    message.channelName,
    ["catslap", "elisslap"],
    "💢😡",
  );

  const slaps = [
    `${message.displayName} deu um tapa em ${slapTarget} ${emote}`,
    `${message.displayName} deu um tapa bem forte em ${slapTarget} ${emote}`,
    `${message.displayName} deu um tapa com as costas da mão em ${slapTarget} ${emote}`,
  ];

  return {
    reply: fb.utils.randomChoice(slaps),
  };
};

slapCommand.commandName = "slap";
slapCommand.aliases = ["slap", "tapa"];
slapCommand.shortDescription = "Dá um tapa em alguém no chat";
slapCommand.cooldown = 5000;
slapCommand.cooldownType = "channel";
slapCommand.whisperable = true;
slapCommand.description = `Dê um tapa virtual em alguém do chat
• Exemplo: !slap @pessoa`;
slapCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/src/commands/${__dirname.split(path.sep).pop()}/${__filename.split(path.sep).pop()}`;

module.exports = { slapCommand };
