const removePlusCommand = async (message) => {
  const userToRemove = message.args[1]?.replace(/^@/, "").toLowerCase() || null;
  if (!userToRemove) {
    return {
      reply: `Use o formato ${message.prefix}removeplus <usuário>`,
    };
  }

  const userInfo = await fb.api.helix.getUserByUsername(userToRemove);
  if (!userInfo) {
    return {
      reply: `Esse usuário não existe`,
    };
  }

  await fb.db.update(
    "users",
    { userid: userInfo.id },
    {
      $set: {
        isPlus: false,
      },
    }
  );

  return {
    reply: `${userToRemove} não é mais Plus`,
  };
};

// Command metadata
removePlusCommand.commandName = "removeplus";
removePlusCommand.aliases = ["removeplus"];
removePlusCommand.shortDescription = "[DEV] Remover status Plus de um usuário";
removePlusCommand.cooldown = 5_000;
removePlusCommand.cooldownType = "user";
removePlusCommand.permissions = ["admin"];
removePlusCommand.whisperable = true;
removePlusCommand.flags = ["dev"];
removePlusCommand.description = `Remove o status Plus de um usuário`;

module.exports = { removePlusCommand };
