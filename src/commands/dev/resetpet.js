const resetPetCommand = async () => {
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
resetPetCommand.cooldown = 5_000;
resetPetCommand.cooldownType = "user";
resetPetCommand.permissions = ["admin"];
resetPetCommand.whisperable = false;
resetPetCommand.flags = ["dev"];

module.exports = { resetPetCommand };
