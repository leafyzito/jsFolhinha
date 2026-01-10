const path = require("path");
const talkieCommand = async (message) => {
  if (message.args.length === 1) {
    return {
      reply: `Use o formato: ${message.prefix}talkie <mensagem>`,
    };
  }

  const isUserPlus =
    (await fb.db.get("users", { userid: message.senderUserID }))?.isPlus ==
    true;

  let msgContent = message.args.slice(1).join(" ").trim();

  msgContent = fb.utils.sanitizeOtherPrefixes(msgContent);

  if (msgContent === "") {
    return {
      reply: `Use o formato: ${message.prefix}talkie <mensagem válida>`,
    };
  }

  let joinedChannels = [...fb.twitch.anonClient.channelsToJoin];
  let targetChannel;
  let i = 0;
  let found = false;

  while (!found && i < 100) {
    i++;
    targetChannel =
      fb.utils.randomChoice(joinedChannels) || message.channelName;
    const targetConfigs = await fb.db.get("config", { channel: targetChannel });

    if (
      targetChannel !== message.channelName &&
      targetChannel !== "folhinha" &&
      targetChannel !== "folhinhabot" &&
      !targetConfigs?.disabledCommands?.includes(
        message.command?.commandName || "talkie"
      ) &&
      !targetConfigs?.devBanCommands?.includes(
        message.command?.commandName || "talkie"
      ) &&
      !targetConfigs?.isPaused &&
      !(await fb.api.helix.isStreamOnline(targetChannel))
    ) {
      found = true;
      break;
    }

    console.log(
      `looping looking for next talkie target, currentTarget: ${targetChannel}`
    );
    joinedChannels = joinedChannels.filter(
      (channel) => channel !== targetChannel
    );
  }

  if (!found) {
    return {
      reply: `Algo deu errado, contactar @${process.env.DEV_NICK}`,
      notes: `Talkie command failed after 100 attempts to find target channel`,
    };
  }

  // Send the message to the target channel
  fb.log.send(targetChannel, `🤖📞 ${msgContent}`);

  const emote = await fb.emotes.getEmoteFromList(
    message.channelName,
    ["peepogiggle", "peepogiggles"],
    "🤭"
  );

  const sentToPlusString = ` para o chat #${targetChannel} (Plus ⭐)`;

  return {
    reply: `Mensagem enviada ${isUserPlus ? sentToPlusString : ""} ${emote}`,
    notes: `${message.channelName} > ${targetChannel}`,
  };
};

talkieCommand.commandName = "talkie";
talkieCommand.aliases = ["talkie"];
talkieCommand.shortDescription =
  "Envia uma mensagem para um canal aleatório que o bot esteja conectado";
talkieCommand.cooldown = 15_000;
talkieCommand.cooldownType = "channel";
talkieCommand.whisperable = false;
talkieCommand.description = `Envie uma mensagem misteriosa para um canal aleatório que o Folhinha esteja conectado

• Exemplo: !talkie Olá mundo - O bot irá enviar a mensagem "Olá mundo" para um canal aleatório

Se quiser desabilitar a possibilidade do seu chat ser um dos canais onde o bot irá enviar mensagens misteriosas, use o comando !config ban talkie`;
talkieCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/src/commands/${__dirname
  .split(path.sep)
  .pop()}/${__filename.split(path.sep).pop()}`;

module.exports = {
  talkieCommand,
};
