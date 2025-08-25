const { commandHandler, listenerHandler } = require("../../../handlers");

const duplicateMessages = [];

module.exports = async function onMessage(message) {
  // handle duplicate messages from shared chats
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

  // add content from parent message to message if exists and remove the first word (the reply)
  if (message.replyParentMessageBody) {
    message.messageText =
      message.messageText.split(" ").slice(1).join(" ") +
      " " +
      message.replyParentMessageBody;
  }

  // sanitize message
  message.messageText = message.messageText.replace(
    /\u200B|\u200C|\u200D|\u200E|\u200F|\u{E0000}/gu,
    ""
  );
  message.messageText = message.messageText.trim();

  const channelData = await fb.db.get("config", {
    channelId: message.channelID,
  });

  // set custom properties
  message.prefix =
    process.env.ENV === "prod" ? channelData?.prefix || "!" : "!!";

  message.internalTimestamp = new Date().getTime();
  message.isStreamer = message.badges.hasBroadcaster;
  if (message.isStreamer) message.isMod = true;
  message.isVip = message.badges.hasVIP;
  message.isFirstMsg = message.ircTags["first-msg"] === "1" ? true : false;
  message.isSub = message.badges.hasSubscriber;
  message.isAdmin = process.env.ADMIN_USERIDS.includes(message.senderUserID);
  message.args = message.messageText.split(" ");

  // handle listeners and commands
  commandHandler(message);
  listenerHandler(message);
};
