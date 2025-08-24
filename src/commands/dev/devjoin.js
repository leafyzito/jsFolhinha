const devJoinChannelCommand = async (message) => {
  message.command = "dev devjoin";

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

  fb.twitch.join([targetChannel]);

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
devJoinChannelCommand.cooldown = 0;
devJoinChannelCommand.cooldownType = "user";
devJoinChannelCommand.permissions = ["admin"];
devJoinChannelCommand.whisperable = false;

module.exports = { devJoinChannelCommand };
