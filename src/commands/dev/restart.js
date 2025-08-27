const { exec } = require("child_process");
const { promisify } = require("util");

const execAsync = promisify(exec);

const restartCommand = async () => {
  try {
    // Execute docker compose restart for all bot-related services
    await execAsync("docker compose -p folhinha restart");

    return {
      reply: `🔄 Reiniciando...`,
    };
  } catch (error) {
    console.error("Error restarting container:", error);
    return {
      reply: `❌ Erro ao reiniciar: ${error.message}`,
    };
  }
};

// Command metadata
restartCommand.commandName = "restart";
restartCommand.aliases = ["restart"];
restartCommand.shortDescription = "Restart the bot";
restartCommand.cooldown = 5_000;
restartCommand.cooldownType = "user";
restartCommand.permissions = ["admin"];
restartCommand.whisperable = false;
restartCommand.flags = ["dev"];

module.exports = { restartCommand };
