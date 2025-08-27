const devJoinChannelCommand = async (message) => {
  const targetChannel = message.args[1];
  const announceFlag = message.args[2] === "true" || false;

  if (!targetChannel) {
    return {
      reply: `Use o formato ${message.prefix}devjoin <canal>`,
    };
  }

  const targetChannelId = (await fb.api.helix.getUserByUsername(targetChannel))
    ?.id;
  if (!targetChannelId) {
    return {
      reply: `Esse canal não existe`,
    };
  }

  await fb.utils.createNewChannelConfig(targetChannelId);

  const joinResult = fb.twitch.join([targetChannel]);
  if (!joinResult) {
    return {
      reply: `Erro ao entrar no canal ${targetChannel}`,
    };
  }

  if (announceFlag) {
    const emote = await fb.emotes.getEmoteFromList(
      targetChannel,
      ["peepohey", "heyge"],
      "KonCha"
    );
    fb.log.send(
      targetChannel,
      `${emote} Oioi! Fui convidado para me juntar aqui! Para saber mais sobre mim, pode usar !ajuda ou !comandos`
    );
  }

  return {
    reply: `🤖 Criei config e entrei no canal ${targetChannel}`,
  };
};

// Command metadata
devJoinChannelCommand.commandName = "devjoin";
devJoinChannelCommand.aliases = ["devjoin", "djoin"];
devJoinChannelCommand.shortDescription = "Join a channel";
devJoinChannelCommand.cooldown = 5_000;
devJoinChannelCommand.cooldownType = "user";
devJoinChannelCommand.permissions = ["admin"];
devJoinChannelCommand.whisperable = false;
devJoinChannelCommand.flags = ["dev"];

module.exports = { devJoinChannelCommand };
