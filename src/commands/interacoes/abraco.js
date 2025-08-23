const abracoCommand = async (message) => {
  if (message.args.length === 1) {
    return {
      reply: `Use o formato: ${message.prefix}abraço <pessoa pra abraçar>`,
    };
  }

  const hugTarget = message.args[1].replace(/^@/, "");

  if (hugTarget.toLowerCase() === message.senderUsername) {
    return {
      reply: `Você estava se sentido carente e resolveu se abraçar a si mesmo 🤗`,
    };
  }

  if (["folhinha", "folhinhabot"].includes(hugTarget.toLowerCase())) {
    const emote = await fb.emotes.getEmoteFromList(
      message.channelName,
      ["cathug", "dankhug", "hugs"],
      "peepoHappy 🌹"
    );
    return {
      reply: emote,
    };
  }

  const emote = await fb.emotes.getEmoteFromList(
    message.channelName,
    ["cathug", "dankhug", "hugs"],
    "🤗"
  );

  const hugs = [
    `${message.senderUsername} abraçou ${hugTarget} bem forte ${emote}`,
    `${message.senderUsername} deu um abraço bem apertado em ${hugTarget} ${emote}`,
    `${message.senderUsername} abraçou e quase explodiu ${hugTarget} ${emote}`,
    `${message.senderUsername} abraçou ${hugTarget} bem forte ${emote}`,
    `${message.senderUsername} abraçou e esmagou ${hugTarget} ${emote}`,
    `${message.senderUsername} abraçou ${hugTarget} tão forte que foi parar ao espaço ${emote}`,
  ];

  return {
    reply: fb.utils.randomChoice(hugs),
  };
};

abracoCommand.commandName = "abraco";
abracoCommand.aliases = ["abraco", "abraço", "abracar", "abraçar", "hug"];
abracoCommand.shortDescription = "Dá um abraço em alguém no chat";
abracoCommand.cooldown = 5000;
abracoCommand.cooldownType = "channel";
abracoCommand.whisperable = true;
abracoCommand.description = `Marque alguém do chat para dar um abraço virtual
• Exemplo: !abraco @pessoa`;
abracoCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/src/commands/${__dirname
  .split("/")
  .pop()}/${__filename.split("/").pop()}`;

module.exports = { abracoCommand };
