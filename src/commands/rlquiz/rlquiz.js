const path = require("path");

async function getRlQuiz(channelId) {
  const response = await fb.api.rustlog.getRandomLine(channelId, null, true);
  if (!response || response.length === 0) {
    return null;
  }
  const userId = response.messages[0].tags["user-id"];
  const rlUsername = response.messages[0].displayName.toLowerCase();
  const currUsername =
    (await fb.api.helix.getUserByID(userId))?.login || rlUsername;
  const timestamp = response.messages[0].timestamp;
  const message = response.messages[0].text;

  return { userId, rlUsername, currUsername, timestamp, message };
}

const rlquizCommand = async (message) => {
  const rlQuiz = await getRlQuiz(message.channelID);
  await fb.log.reply(
    message,
    `Adivinhe quem enviou esta mensagem (há ${fb.utils.relativeTime(
      rlQuiz.timestamp,
      true,
      true
    )}): ${rlQuiz.message}`
  );

  const check = {
    channelName: message.channelName,
    content: [rlQuiz.rlUsername, rlQuiz.currUsername],
  };
  const responseMsg = await fb.utils.waitForMessage(check);
  if (!responseMsg) {
    const emote = await fb.emotes.getEmoteFromList(
      message.channelName,
      fb.emotes.sadEmotes,
      ":("
    );
    return {
      reply: `Ninguém adivinhou quem enviou a mensagem! ${emote} A resposta era: ${rlQuiz.currUsername}`,
      notes: `${rlQuiz.message} -> ${rlQuiz.currUsername}`,
    };
  }

  const emote = await fb.emotes.getEmoteFromList(
    message.channelName,
    fb.emotes.pogEmotes,
    "PogChamp"
  );
  return {
    reply: `${responseMsg.senderUsername} acertou quem enviou a mensagem! ${emote}`,
    notes: `${rlQuiz.message} -> ${rlQuiz.currUsername}`,
  };
};

rlquizCommand.commandName = "randomlinequiz";
rlquizCommand.aliases = ["randomlinequiz", "rlquiz"];
rlquizCommand.shortDescription =
  "Adivinhe quem enviou uma mensagem aleatória do chat";
rlquizCommand.cooldown = 30_000;
rlquizCommand.cooldownType = "channel";
rlquizCommand.whisperable = false;
rlquizCommand.description = `Adivinhe quem enviou uma mensagem aleatória do chat no qual o comando foi executado`;
rlquizCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/src/commands/${__dirname
  .split(path.sep)
  .pop()}/${__filename.split(path.sep).pop()}`;

module.exports = { rlquizCommand };
