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
resetCdCommand.shortDescription = "Reset cookies";
resetCdCommand.cooldown = 5_000;
resetCdCommand.cooldownType = "user";
resetCdCommand.permissions = ["admin"];
resetCdCommand.whisperable = false;
resetCdCommand.flags = ["dev"];

module.exports = { resetCdCommand };
