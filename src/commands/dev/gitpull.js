const { exec } = require("child_process");

const gitPullCommand = async () => {
  return new Promise((resolve) => {
    exec("git pull", (error, stdout) => {
      if (error) {
        resolve({
          reply: `Git pull error: ${error.message}`,
          notes: `Git pull failed: ${error}`,
        });
        return;
      }
      resolve({
        reply: `Git pull successful: ${stdout}`,
        notes: `Git pull success: ${stdout}`,
      });
    });
  });
};

// Command metadata
gitPullCommand.commandName = "gitpull";
gitPullCommand.aliases = ["gitpull", "gpull"];
gitPullCommand.shortDescription =
  "[DEV] Atualiza o bot com as últimas mudanças";
gitPullCommand.cooldown = 5_000;
gitPullCommand.cooldownType = "user";
gitPullCommand.permissions = ["admin"];
gitPullCommand.whisperable = false;
gitPullCommand.flags = ["dev"];
gitPullCommand.description = `Busca as atualizações mais recentes do bot, mas não as aplica`;

module.exports = { gitPullCommand };
