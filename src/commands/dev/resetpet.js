const resetPetCommand = async (message) => {
  message.command = "dev resetpet";

  const now = Math.floor(Date.now() / 1000);
  await fb.db.updateMany("pet", {}, { $set: { last_interaction: now } });

  return {
    reply: `Feito 👍`,
  };
};

// Command metadata
resetPetCommand.commandName = "resetpet";
resetPetCommand.aliases = ["resetpet", "resetpat"];
resetPetCommand.shortDescription = "Reset pet last interaction";
resetPetCommand.cooldown = 0;
resetPetCommand.cooldownType = "user";
resetPetCommand.permissions = ["admin"];
resetPetCommand.whisperable = false;

module.exports = { resetPetCommand };
