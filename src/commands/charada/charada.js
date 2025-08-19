const charadasData = require("./charadas.json");

let usedCharadas = [];

const charadaCommand = async (message) => {
  if (usedCharadas.length === Object.values(charadasData).length) {
    usedCharadas = [];
  }

  const charada = fb.utils.randomChoice(Object.values(charadasData));
  usedCharadas.push(charada);
  console.log(charada);

  await fb.log.reply(
    message,
    `${message.senderUsername} iniciou uma charada! 🤔 ${fb.utils.capitalize(
      charada.pergunta
    )}`
  );

  const check = {
    channelName: message.channelName,
    content: charada.resposta,
  };
  const responseMsg = await fb.utils.waitForMessage(check);
  if (!responseMsg) {
    const emote = await fb.emotes.getEmoteFromList(
      message.channelName,
      fb.emotes.sadEmotes,
      ":("
    );
    return {
      reply: `Ninguém respondeu a charada a tempo! ${emote} A resposta era: ${charada.resposta[0]}`,
      notes: `${charada.pergunta} -> ${charada.resposta[0]}`,
    };
  }

  const emote = await fb.emotes.getEmoteFromList(
    message.channelName,
    ["nerd", "nerdge", "catnerd", "dognerd", "giganerd"],
    "🤓"
  );
  return {
    reply: `${responseMsg.senderUsername} acertou a resposta! ${emote}`,
    notes: `${charada.pergunta} -> ${charada.resposta[0]}`,
  };
};

charadaCommand.commandName = "charada";
charadaCommand.aliases = ["charada", "charadas"];
charadaCommand.shortDescription =
  "Inicie uma charada que todos podem participar";
charadaCommand.cooldown = 30_000;
charadaCommand.cooldownType = "channel";
charadaCommand.whisperable = false;
charadaCommand.description = `Inicie uma charada que todos do chat (no qual o comando foi executado) podem participar
Se ninguém do chat responder a charada a tempo dentro de 30 segundos, a resposta será revelada`;
charadaCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/src/commands/${__dirname
  .split("/")
  .pop()}/${__filename.split("/").pop()}`;

module.exports = {
  charadaCommand,
};
