const { exec } = require("child_process");
const { promisify } = require("util");

const execAsync = promisify(exec);

const restartCommand = async (message) => {
  try {
    fb.log.send(message.channelName, "Reiniciando...");

    // give time for the message to be sent
    await new Promise((resolve) => setTimeout(resolve, 2000));
    // Execute docker compose restart for all bot-related services
    await execAsync("docker compose -p folhinha restart");
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
restartCommand.shortDescription = "[DEV] Reinicia o bot";
restartCommand.cooldown = 5_000;
restartCommand.cooldownType = "user";
restartCommand.permissions = ["admin"];
restartCommand.whisperable = true;
restartCommand.flags = ["dev"];
restartCommand.description = `Reinicia o Docker container do bot`;

module.exports = { restartCommand };
