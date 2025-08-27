const rustlogRemoveCommand = async (message) => {
  const targetUser = message.args[1];
  if (!targetUser) {
    return {
      reply: `Use o formato ${message.prefix}rustlogremove <username>`,
    };
  }

  try {
    const userData = await fb.api.helix.getUserByUsername(targetUser);
    if (!userData) {
      return {
        reply: `Esse usuário não existe`,
      };
    }
    const userId = userData.id;
    await fb.api.rustlog.removeChannel(userId);
    return {
      reply: `🤖 Canal removido do rustlog: ${targetUser}`,
    };
  } catch (err) {
    return {
      reply: `Erro ao remover do rustlog: ${err.message}`,
    };
  }
};

// Command metadata
rustlogRemoveCommand.commandName = "rustlogremove";
rustlogRemoveCommand.aliases = [
  "rustlogremove",
  "rlremove",
  "rldelete",
  "rldel",
];
rustlogRemoveCommand.shortDescription = "Remove a channel from rustlog";
rustlogRemoveCommand.cooldown = 5_000;
rustlogRemoveCommand.cooldownType = "user";
rustlogRemoveCommand.permissions = ["admin"];
rustlogRemoveCommand.whisperable = false;
rustlogRemoveCommand.flags = ["dev"];

module.exports = { rustlogRemoveCommand };
