const setPlusCommand = async (message) => {
  const userToSet = message.args[1]?.replace(/^@/, "").toLowerCase() || null;
  const amount = parseInt(
    message.args[2]?.replace(/^@/, "").toLowerCase() || null
  );
  if (!userToSet || !amount) {
    return {
      reply: `Use o formato ${message.prefix}setplus <usuário> <amount>`,
    };
  }

  const userInfo = await fb.api.helix.getUserByUsername(userToSet);
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
        isSupporter: true,
        isPlus: true,
        lastSupportDate: Math.floor(Date.now() / 1000),
        totalDonated: amount,
      },
    }
  );

  return {
    reply: `${userToSet} agora é Plus! ⭐`,
  };
};

// Command metadata
setPlusCommand.commandName = "setplus";
setPlusCommand.aliases = ["setplus"];
setPlusCommand.shortDescription = "[DEV] Colocar status Plus em um usuário";
setPlusCommand.cooldown = 5_000;
setPlusCommand.cooldownType = "user";
setPlusCommand.permissions = ["admin"];
setPlusCommand.whisperable = true;
setPlusCommand.flags = ["dev"];
setPlusCommand.description = `Coloca o status Plus em um usuário (que apoiou o projeto com mais de R$10) e define o valor do apoio`;

module.exports = { setPlusCommand };
