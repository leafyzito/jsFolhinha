// TODO:
// need to add a "success" field on all command responses to check if any failed
// add pipable or non-pipable command flags for specific commands

const path = require("path");

const pipeCommand = async (msg) => {
  // Join everything after the command, then split by "|"
  // Each segment is one pipe stage, e.g.: "!pipe gpt hello | translate to:es"
  // Yields ["gpt hello", "translate to:es"]
  const pipeString = msg.args.slice(1).join(" ");
  const pipeSegments = pipeString
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);

  if (pipeSegments.length === 0) {
    return {
      reply: "Use o formato blablabla",
    };
  }

  let lastReply = null;

  // We'll mutate a shallow copy of the original msg for each stage
  const msgBase = { ...msg };

  for (let i = 0; i < pipeSegments.length; i++) {
    const segment = pipeSegments[i];

    // Split segment into command + args
    const segmentParts = segment.split(" ").filter(Boolean);
    if (segmentParts.length === 0) {
      return { reply: "erm?" };
    }
    const commandName = segmentParts[0];
    let commandArgs = segmentParts.slice(1);

    if (!(commandName in fb.commandsList)) {
      return { reply: `Comando "${commandName}" não existe.` };
    }

    // For any but the first pipe, append the last reply as input
    if (i > 0 && lastReply) {
      // Put the previous reply at the end of args, as natural text
      commandArgs = commandArgs.concat(lastReply.split(" "));
    }

    // Construct a fresh message object for the command
    // (shallow copy base, then override input)
    const stageMsg = {
      ...msgBase,
      command: fb.commandsList[commandName],
      args: [msg.prefix + commandName, ...commandArgs],
      messageText: commandArgs.join(" "),
      // Keep "originalMessageText" in case needed by some commands:
      originalMessageText: commandArgs.join(" "),
    };

    let commandRes;
    try {
      commandRes = await fb.commandsList[commandName](stageMsg);
    } catch (e) {
      console.log(e);
      return { reply: `Erro ao executar "${commandName}"` };
    }

    if (!commandRes || !commandRes.reply) {
      return { reply: `O comando "${commandName}" não retornou resposta` };
    }

    console.log(`Resposta de ${commandName}: ${commandRes.reply}`);
    console.log("===");
    lastReply = commandRes.reply;
  }

  return {
    reply: lastReply || "default response",
  };
};

pipeCommand.commandName = "pipe";
pipeCommand.aliases = ["pipe", "p", "pipeline"];
pipeCommand.shortDescription =
  "Executa uma cadeia de comandos, passando a saída de um como entrada do próximo usando pipe (|).";
pipeCommand.cooldown = 5000;
pipeCommand.cooldownType = "user";
pipeCommand.whisperable = false;
pipeCommand.description = `Permite executar múltiplos comandos em sequência, passando a resposta de um comando como entrada do próximo usando "|".
Exemplo: !pipe gpt hello there | translate to:es
Isto roda o comando "gpt hello there", depois passa a resposta para "translate to:es".
Separe os comandos com "|" (pipe).`;
pipeCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/src/commands/${__dirname
  .split(path.sep)
  .pop()}/${__filename.split(path.sep).pop()}`;

module.exports = {
  pipeCommand,
};
