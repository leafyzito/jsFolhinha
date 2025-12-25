const path = require("path");
const createLinearIssue = async (
  sugestao,
  channelName,
  senderUsername,
  formattedDate,
  suggestionId
) => {
  try {
    const issueTitle = `Suggestion #${suggestionId}`;
    const issueDescription = `Channel: ${channelName}\nUser: ${senderUsername}\nDate: ${formattedDate}\n\n${sugestao}`;

    const linearIssue = await fb.api.linear.createIssue(
      issueTitle,
      issueDescription
    );

    return linearIssue;
  } catch (error) {
    fb.discord.logError(
      `Failed to create Linear issue for suggestion: ${error.message}`
    );
    return null;
  }
};

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

  const newSuggId = (await fb.db.count("sugestoes", {}, true)) + 1;
  await fb.db.insert("sugestoes", {
    _id: newSuggId,
    channel: message.channelName,
    user: message.senderUsername,
    sugestao: sugestao,
    date: formattedDate,
  });

  // Create Linear issue for the suggestion
  const linearIssue = await createLinearIssue(
    sugestao,
    message.channelName,
    message.senderUsername,
    formattedDate,
    newSuggId
  );

  const emote = await fb.emotes.getEmoteFromList(
    message.channelName,
    ["joia", "jumilhao"],
    "FeelsOkayMan 👍"
  );

  const reply = `Obrigado pela sugestão ${emote} (ID ${newSuggId})`;

  const result = {
    reply,
  };

  if (linearIssue && linearIssue.url) {
    result.notes = `Issue criado: ${linearIssue.url}`;
  }

  return result;
};

sugerirCommand.commandName = "sugerir";
sugerirCommand.aliases = [
  "sugerir",
  "sugestao",
  "sugestão",
  "suggest",
  "suggestion",
];
sugerirCommand.shortDescription = "Envia uma sugestão para o bot";
sugerirCommand.cooldown = 5000;
sugerirCommand.cooldownType = "user";
sugerirCommand.whisperable = true;
sugerirCommand.description = `Deixe a sua contribuição para a caixinha de sugestões do Folhinha, poderá relatar bugs, erros, inovações...

Qualquer coisa que ache que possa melhorar a experiência com o Folhinha e suas funcionalidades`;
sugerirCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/src/commands/${__dirname
  .split(path.sep)
  .pop()}/${__filename.split(path.sep).pop()}`;

module.exports = {
  sugerirCommand,
};
