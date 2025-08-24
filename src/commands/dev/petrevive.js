const revivePetCommand = async (message) => {
  message.command = "dev petrevive";

  const targetChannel = message.args[1];
  if (!targetChannel) {
    return {
      reply: `Use o formato ${message.prefix}petrevive <canal para reviver pet>`,
    };
  }

  const targetChannelId = (await fb.api.helix.getUserByUsername(targetChannel))
    ?.id;

  if (!targetChannelId) {
    return {
      reply: `Esse canal não existe`,
    };
  }

  try {
    await fb.db.update(
      "pet",
      { channelId: targetChannelId },
      {
        $set: {
          is_alive: true,
          last_interaction: Math.floor(Date.now() / 1000),
        },
      }
    );
    return {
      reply: `Pet revivido para ${targetChannel}`,
    };
  } catch (err) {
    return {
      reply: `Erro ao reviver pet: ${err.message}`,
    };
  }
};

// Command metadata
revivePetCommand.commandName = "petrevive";
revivePetCommand.aliases = ["petrevive", "revivepet"];
revivePetCommand.shortDescription = "Revive pet";
revivePetCommand.cooldown = 0;
revivePetCommand.cooldownType = "user";
revivePetCommand.permissions = ["admin"];
revivePetCommand.whisperable = false;

module.exports = { revivePetCommand };
