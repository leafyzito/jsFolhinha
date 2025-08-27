const devPartChannelCommand = async (message) => {
  message.command = "dev devpart";

  const targetChannel = message.args[1];
  if (!targetChannel) {
    return {
      reply: `Use o formato ${message.prefix}devpart <canal>`,
    };
  }

  const targetChannelId = (await fb.api.helix.getUserByUsername(targetChannel))
    ?.id;
  if (!targetChannelId) {
    return {
      reply: `Esse canal não existe`,
    };
  }

  fb.twitch.part(targetChannel);
  await fb.db.delete("config", { channelId: targetChannelId });

  return {
    reply: `🤖 Apaguei config a saí do canal ${targetChannel}`,
  };
};

// Command metadata
devPartChannelCommand.commandName = "devpart";
devPartChannelCommand.aliases = ["devpart", "dpart"];
devPartChannelCommand.shortDescription = "Part a channel";
devPartChannelCommand.cooldown = 5_000;
devPartChannelCommand.cooldownType = "user";
devPartChannelCommand.permissions = ["admin"];
devPartChannelCommand.whisperable = false;

module.exports = { devPartChannelCommand };
