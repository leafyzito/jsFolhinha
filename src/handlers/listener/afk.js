const { afkInfoObjects } = require("../../commands/afk/afk_info_model.js");
const { shouldSkipMessage } = require("./middleware");

let processingAfk = [];

const afkUserListener = async (message) => {
  if (
    message.command?.commandName === "afk" ||
    message.command?.commandName === "resumeafk"
  ) {
    return;
  }

  // check if channel is paused or has reminders banned
  if (await shouldSkipMessage(message, "afk")) {
    return;
  }

  // Check if user is AFK directly from database (will use database cache)
  const afkStats = await fb.db.get("afk", {
    channel: message.channelName,
    user: message.senderUsername,
    is_afk: true,
  });

  if (!afkStats) {
    return;
  }

  if (processingAfk.includes(message.senderUsername)) {
    return;
  }

  processingAfk.push(message.senderUsername);

  // Handle case where afkStats might be an array or single document
  const afkData = Array.isArray(afkStats) ? afkStats[0] : afkStats;

  const afkInfoObject = afkInfoObjects.find((afk) =>
    afk.alias.includes(afkData.afk_type),
  );
  const afkReturned = afkInfoObject.returned;
  const afkEmoji = afkInfoObject.emoji;
  const afkMessage = afkData.afk_message;
  const afkSince = fb.utils.relativeTime(afkData.afk_since, true);

  fb.log.send(
    message.channelName,
    `${message.displayName} ${afkReturned} ${afkEmoji} ${
      afkMessage ? `: ${afkMessage}` : ""
    } (afk por ${afkSince})`,
  );

  await fb.db.update(
    "afk",
    { channel: message.channelName, user: message.senderUsername },
    { $set: { is_afk: false, afk_return: Math.floor(Date.now() / 1000) } },
  );

  processingAfk = processingAfk.filter(
    (user) => user !== message.senderUsername,
  );
  return;
};

module.exports = {
  afkUserListener,
};
