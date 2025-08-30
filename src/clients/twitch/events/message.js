const { commandHandler, listenerHandler } = require("../../../handlers");

const duplicateMessages = [];

module.exports = async function onMessage(channel, username, text, message) {
  message.messageText = text;
  // Check if this message matches any waiting criteria first
  fb.utils.checkMessageWaiters(message);

  // handle duplicate messages from shared chats
  /*const sourceRoomId = message.ircTags["source-room-id"] || null;
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
  }*/

  // add content from parent message to message if exists and remove the first word (the reply)
  message.isReply = false;
  message.originalMessageText = message.messageText;
  if (message.replyParentMessageBody) {
    message.isReply = true;
    message.messageText =
      message.messageText + " " + message.replyParentMessageBody;
  }

  // sanitize message
  message.messageText = message.messageText.replace(
    /\u200B|\u200C|\u200D|\u200E|\u200F|\u{E0000}/gu,
    ""
  );
  message.messageText = message.messageText.trim();
  message.channelID = message.channelId;

  const channelData = await fb.db.get("config", {
    channelId: message.channelID,
  });

  // set custom properties
  message.prefix =
    process.env.ENV === "prod" ? channelData?.prefix || "!" : "!!";
  Object.defineProperty(message, "prefix", {
    value: process.env.ENV === "prod" ? channelData?.prefix || "!" : "!!",
    writable: true,
    configurable: true,
    enumerable: true,
  });

  message.senderUsername = username.toLowerCase();
  message.senderUserID = message.userInfo.userId;
  message.displayName = message.userInfo.displayName;

  message.channelName = channel.toLowerCase();

  message.internalTimestamp = new Date().getTime();
  message.isMod = message.userInfo.isMod;
  message.isStreamer = message.userInfo.isBroadcaster;
  if (message.isStreamer) message.isMod = true;
  message.isVip = message.userInfo.isVip;
  message.isFirstMsg = message.isFirst;
  message.isSub = message.userInfo.isSubscriber;
  message.isAdmin = process.env.ADMIN_USERIDS.includes(message.senderUserID);
  message.args = message.messageText.split(" ");

  // handle listeners and commands
  commandHandler(message);
  listenerHandler(message);
};
