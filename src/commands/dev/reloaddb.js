const reloadDbCommand = async () => {
  try {
    fb.db.clearCache();

    return {
      reply: `Base de dados recarregada 👍`,
    };
  } catch (err) {
    return {
      reply: `Erro ao recarregar base de dados: ${err.message}`,
    };
  }
};

// Command metadata
reloadDbCommand.commandName = "reloaddb";
reloadDbCommand.aliases = ["reloaddb", "reloadbd"];
reloadDbCommand.shortDescription = "Reload database";
reloadDbCommand.cooldown = 5_000;
reloadDbCommand.cooldownType = "user";
reloadDbCommand.permissions = ["admin"];
reloadDbCommand.whisperable = false;
reloadDbCommand.flags = ["dev"];

module.exports = { reloadDbCommand };
