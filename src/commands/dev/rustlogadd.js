const rustlogAddCommand = async (message) => {
  const targetUser = message.args[1];
  if (!targetUser) {
    return {
      reply: `Use o formato ${message.prefix}rustlogadd <username>`,
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
    await fb.api.rustlog.addChannel(userId);
    return {
      reply: `🤖 Canal adicionado ao rustlog: ${targetUser}`,
    };
  } catch (err) {
    return {
      reply: `Erro ao adicionar ao rustlog: ${err.message}`,
    };
  }
};

// Command metadata
rustlogAddCommand.commandName = "rustlogadd";
rustlogAddCommand.aliases = ["rustlogadd", "rladd"];
rustlogAddCommand.shortDescription = "Add a channel to rustlog";
rustlogAddCommand.cooldown = 5_000;
rustlogAddCommand.cooldownType = "user";
rustlogAddCommand.permissions = ["admin"];
rustlogAddCommand.whisperable = false;
rustlogAddCommand.flags = ["dev"];

module.exports = { rustlogAddCommand };
