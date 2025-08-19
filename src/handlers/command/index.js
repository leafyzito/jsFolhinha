const { validateCommandExecution } = require("../../commands/commandValidator");
const { commandsList } = require("../../commands/commandsList");

async function checkCommandExecution(command, message) {
  if (
    !(await validateCommandExecution(
      commandsList[command].cooldown,
      commandsList[command].cooldownType,
      message
    ))
  ) {
    return false;
  }

  // check if command is whisperable
  if (message.isWhisper && !commandsList[command].whisperable) {
    return false;
  }

  return true;
}

async function commandHandler(message) {
  if (message.senderUsername == process.env.BOT_USERNAME) {
    return;
  }

  if (!message.messageText.startsWith(message.commandPrefix)) {
    return;
  }

  const command = message.args[0]
    .slice(message.commandPrefix.length)
    .toLowerCase();

  if (!(command in commandsList)) {
    return;
  }

  message.command = commandsList[command].commandName;
  if (!(await checkCommandExecution(command, message))) {
    return;
  }

  let commandResult;
  try {
    commandResult = await commandsList[command](message);
  } catch (err) {
    console.log(
      `Error in command in #${message.channelName}/${message.senderUsername} - ${command}: ${err}`
    );
    fb.discord.logError(
      `Error in command #${message.channelName}/${message.senderUsername} - ${command}: ${err}`
    );
    fb.log.logAndReply(
      message,
      `⚠️ Ocorreu um erro ao executar o comando, tente novamente`
    );
    return;
  }

  if (!commandResult) {
    return;
  }

  if (!commandResult.replyType) {
    // default reply type to reply if not specified
    commandResult.replyType = "reply";
  }

  message.notes = commandResult.notes;
  message.responseTime = new Date().getTime() - message.serverTimestampRaw;
  message.internalResponseTime =
    new Date().getTime() - message.internalTimestamp;

  if (message.isWhisper) {
    fb.log.logAndWhisper(message, commandResult.reply);
  } else {
    switch (commandResult.replyType) {
      case "reply":
        fb.log.logAndReply(message, commandResult.reply);
        break;
      case "say":
        fb.log.logAndSay(message, commandResult.reply);
        break;
      case "me":
        fb.log.logAndMeAction(message, commandResult.reply);
        break;
      default:
        break;
    }
  }

  // update 7tv presence
  fb.api.stv.updatePresence(process.env.BOT_7TV_UID, message.channelID);
}

module.exports = {
  commandHandler,
};
