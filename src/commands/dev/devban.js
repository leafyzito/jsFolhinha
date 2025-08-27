const { commandsList } = require("../../commands/commandsList");

function getCommandObjectByAlias(alias) {
  return (
    Object.values(commandsList)
      .flatMap((command) => [command, ...command.aliases])
      .find(
        (item) => item.aliases?.includes(alias) || item.commandName === alias
      ) || null
  );
}

const devBanCommand = async (message) => {
  message.command = "dev devban";

  const targetUser = message.args[1];
  if (!targetUser) {
    return {
      reply: `Use o formato: ${message.prefix}devban <usuário> <all/comando>`,
    };
  }

  const targetUserId = (await fb.api.helix.getUserByUsername(targetUser))?.id;

  if (!targetUserId) {
    return {
      reply: `Esse usuário não existe`,
    };
  }

  const targetCommand = message.args[2];

  if (!targetCommand) {
    return {
      reply: `Comando não especificado`,
    };
  }

  // Check if targetCommand is "all" or a valid command
  let commandToBan = targetCommand;
  if (targetCommand.toLowerCase() !== "all") {
    const command = getCommandObjectByAlias(targetCommand.toLowerCase());
    if (!command) {
      return {
        reply: `O comando ${targetCommand} não é válido`,
      };
    }
    // Use commandName for the database
    commandToBan = command.commandName;
  }

  // Check if user already has ban record, create if not
  const hasBanRecord = await fb.db.get("bans", { userId: targetUserId });
  if (!hasBanRecord) {
    await fb.db.insert("bans", { userId: targetUserId, bannedCommands: [] });
  }

  // Add command to banned commands
  await fb.db.update(
    "bans",
    { userId: targetUserId },
    { $push: { bannedCommands: commandToBan } }
  );

  return {
    reply: `👍`,
  };
};

// Command metadata
devBanCommand.commandName = "devban";
devBanCommand.aliases = ["devban", "dban"];
devBanCommand.shortDescription = "Ban a user from using commands";
devBanCommand.cooldown = 5_000;
devBanCommand.cooldownType = "user";
devBanCommand.permissions = ["admin"];
devBanCommand.whisperable = false;

module.exports = { devBanCommand };
