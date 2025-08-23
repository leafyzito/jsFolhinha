const sugerirCommand = async (message) => {
  if (message.args.length === 1) {
    return {
      reply: `Use o formato: ${message.prefix}sugerir <sugestão>`,
    };
  }

  const sugestao = message.args.slice(1).join(" ");

  const currentDate = new Date();
  const formattedDate = currentDate
    .toISOString()
    .replace("T", " ")
    .substr(0, 19);

  await fb.db.insert("sugestoes", {
    channel: message.channelName,
    user: message.senderUsername,
    sugestao: sugestao,
    date: formattedDate,
  });

  const emote = await fb.emotes.getEmoteFromList(
    message.channelName,
    ["joia", "jumilhao"],
    "FeelsOkayMan 👍"
  );

  return {
    reply: `Obrigado pela sugestão. Assim que possível, o @${process.env.DEV_NICK} dará uma olhada ${emote}`,
  };
};

sugerirCommand.commandName = "sugerir";
sugerirCommand.aliases = ["sugerir", "sugestao", "sugestão"];
sugerirCommand.shortDescription = "Envia uma sugestão para o bot";
sugerirCommand.cooldown = 5000;
sugerirCommand.cooldownType = "channel";
sugerirCommand.whisperable = true;
sugerirCommand.description = `Deixe a sua contribuição para a caixinha de sugestões do Folhinha, poderá relatar bugs, erros, inovações...

Qualquer coisa que ache que possa melhorar a experiência com o Folhinha e suas funcionalidades`;
sugerirCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/src/commands/${__dirname
  .split("/")
  .pop()}/${__filename.split("/").pop()}`;

module.exports = {
  sugerirCommand,
};
