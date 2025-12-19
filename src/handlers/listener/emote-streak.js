const { shouldSkipMessage } = require("./middleware");

const emoteStreaks = {};

async function getEmoteInMsg(channelName, args) {
  const allEmotes = (await fb.emotes.getChannelEmotes(channelName)) || [];
  for (const word of args) {
    if (allEmotes.includes(word)) {
      return word;
    }
  }
  return null;
}

const emoteStreakListener = async (message) => {
  console.log(message.originalArgs);
  if (await shouldSkipMessage(message.channelName)) {
    return;
  }

  const channelData = await fb.db.get("config", {
    channelId: message.channelID,
  });

  if (!channelData.emoteStreak) {
    return;
  }

  // Initialize streak data for the channel if not present
  if (!emoteStreaks[message.channelName]) {
    emoteStreaks[message.channelName] = {
      count: 0,
      lastWasEmoteMsg: false,
      emote: null,
    };
  }

  const streakData = emoteStreaks[message.channelName];
  const emoteUsed = await getEmoteInMsg(
    message.channelName,
    message.originalArgs
  );

  if (emoteUsed) {
    if (streakData.lastWasEmoteMsg && streakData.emote === emoteUsed) {
      streakData.count += 1;
    } else {
      // Streak is broken by a different emote
      // If previous streak is valid, announce before resetting
      if (
        streakData.lastWasEmoteMsg &&
        streakData.count >= 3 &&
        streakData.emote &&
        streakData.emote !== emoteUsed
      ) {
        fb.log.send(
          message.channelName,
          `${streakData.count}x ${streakData.emote} streak! `
        );
      }
      streakData.count = 1;
      streakData.emote = emoteUsed;
    }
    streakData.lastWasEmoteMsg = true;
  } else {
    // Non-emote message breaks the streak
    if (
      streakData.lastWasEmoteMsg &&
      streakData.count >= 3 &&
      streakData.emote
    ) {
      fb.log.send(
        message.channelName,
        `${streakData.count}x ${streakData.emote} streak! `
      );
    }
    // Reset streak tracking
    streakData.count = 0;
    streakData.lastWasEmoteMsg = false;
    streakData.emote = null;
  }
};

module.exports = {
  emoteStreakListener,
};
