const { exec } = require("child_process");

const execCommand = async (message) => {
  const command = message.args.slice(1).join(" ");

  return new Promise((resolve) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        resolve({
          reply: `Error: ${error.message}`,
          notes: `Exec command failed: ${command}`,
        });
        return;
      }
      if (stderr) {
        resolve({
          reply: `Stderr: ${stderr}`,
          notes: `Exec command stderr: ${command}`,
        });
        return;
      }
      resolve({
        reply: `Output: ${stdout}`,
        notes: `Exec command success: ${command}`,
      });
    });
  });
};

// Command metadata
execCommand.commandName = "exec";
execCommand.aliases = ["exec", "eval"];
execCommand.shortDescription = "[DEV] Executa um comando no shell do servidor";
execCommand.cooldown = 5_000;
execCommand.cooldownType = "user";
execCommand.permissions = ["admin"];
execCommand.whisperable = false;
execCommand.flags = ["dev"];
execCommand.description = `Executa um comando diretamente no shell do servidor`;

module.exports = { execCommand };
