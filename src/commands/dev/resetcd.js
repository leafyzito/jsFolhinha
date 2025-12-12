const resetCdCommand = async () => {
  await fb.db.updateMany(
    "cookie",
    {},
    { $set: { claimedToday: false, giftedToday: false, usedSlot: false } }
  );

  return {
    reply: `Cookies resetados 👍`,
  };
};

// Command metadata
resetCdCommand.commandName = "resetcd";
resetCdCommand.aliases = ["resetcd"];
resetCdCommand.shortDescription =
  "[DEV] Reseta os estados diários de cookies dos usuários";
resetCdCommand.cooldown = 5_000;
resetCdCommand.cooldownType = "user";
resetCdCommand.permissions = ["admin"];
resetCdCommand.whisperable = false;
resetCdCommand.flags = ["dev"];
resetCdCommand.description = `Reinicia todos os status diários dos comandos de cookies para todos os usuários`;

module.exports = { resetCdCommand };
