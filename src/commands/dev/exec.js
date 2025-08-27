const { exec } = require("child_process");

const execCommand = async (message) => {
  message.command = "dev exec";

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
execCommand.shortDescription = "Execute a shell command";
execCommand.cooldown = 5_000;
execCommand.cooldownType = "user";
execCommand.permissions = ["admin"];
execCommand.whisperable = false;

module.exports = { execCommand };
