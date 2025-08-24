const resetCdCommand = async (message) => {
  message.command = "dev resetcd";

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
resetCdCommand.shortDescription = "Reset cookies";
resetCdCommand.cooldown = 0;
resetCdCommand.cooldownType = "user";
resetCdCommand.permissions = ["admin"];
resetCdCommand.whisperable = false;

module.exports = { resetCdCommand };
