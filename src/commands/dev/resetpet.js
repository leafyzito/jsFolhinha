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
resetPetCommand.shortDescription =
  "[DEV] Reseta o tempo da última interação de todos os pets";
resetPetCommand.cooldown = 5_000;
resetPetCommand.cooldownType = "user";
resetPetCommand.permissions = ["admin"];
resetPetCommand.whisperable = false;
resetPetCommand.flags = ["dev"];
resetPetCommand.description = `Atualiza o tempo da última interação de todos os pets`;

module.exports = { resetPetCommand };
