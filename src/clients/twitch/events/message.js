const { commandHandler, listenerHandler } = require("../../../handlers");

const duplicateMessages = [];

module.exports = async function onMessage(message) {
  const sourceRoomId = message.ircTags["source-room-id"] || null;
  const sourceMessageId = message.ircTags["source-id"] || null;
  if (
    sourceRoomId &&
    sourceRoomId !== message.channelID &&
    fb.twitch.anonClient.channelsToJoin
      .map((channel) => channel.id)
      .includes(sourceRoomId)
  ) {
    return;
  }
  if (sourceMessageId) {
    duplicateMessages.push(sourceMessageId);
    if (duplicateMessages.length > 100) {
      duplicateMessages.shift();
    }
  }

  // sanitize message
  message.messageText = message.messageText.replace(
    /\u200B|\u200C|\u200D|\u200E|\u200F|\u{E0000}/gu,
    ""
  );
  message.messageText = message.messageText.trim();

  const channelData = await fb.db.get("config", {
    channel: message.channelName,
  });

  // set custom properties
  message.commandPrefix =
    process.env.ENV === "prod" ? channelData[0].prefix || "!" : "!!";

  message.internalTimestamp = new Date().getTime();
  message.isStreamer = message.badges.hasBroadcaster;
  if (message.isStreamer) message.isMod = true;
  message.isVip = message.badges.hasVIP;
  message.isFirstMsg = message.ircTags["first-msg"] === "1" ? true : false;
  message.args = message.messageText.split(" ");

  // handle listeners and commands
  listenerHandler(message);
  commandHandler(message);
};
