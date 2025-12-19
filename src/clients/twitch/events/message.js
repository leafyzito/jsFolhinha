const { commandHandler, listenerHandler } = require("../../../handlers");
const { sanitizeText } = require("../../../utils/sanitize-text");

// const duplicateMessages = [];
// function handleDuplicateMessages(message) {
//   const sourceRoomId = message.tags.get("source-room-id") || null;
//   const sourceMessageId = message.tags.get("source-id") || null;

//   if (
//     sourceRoomId &&
//     sourceRoomId !== message.channelID &&
//     fb.twitch.anonClient.channelsToJoin
//       .map((channel) => channel.id)
//       .includes(sourceRoomId)
//   ) {
//     return true; // Should skip this message
//   }

//   if (sourceMessageId) {
//     duplicateMessages.push(sourceMessageId);
//     if (duplicateMessages.length > 100) {
//       duplicateMessages.shift();
//     }
//   }

//   return false; // Continue processing
// }

module.exports = async function onMessage(channel, username, text, message) {
  message.messageText = text;
  // Check if this message matches any waiting criteria first

  // handle duplicate messages from shared chats
  // if (handleDuplicateMessages(message)) return;

  // Handle reply messages and sanitize text
  message.isReply = false;
  message.originalMessageText = message.messageText;

  if (message.parentMessageText) {
    message.isReply = true;
    message.messageText = message.messageText + " " + message.parentMessageText;
  }

  // Sanitize message text to remove invisible characters
  message.messageText = sanitizeText(message.messageText);
  message.channelID = message.channelId;

  // set custom properties
  message.senderUsername = username.toLowerCase();
  message.senderUserID = message.userInfo.userId;
  message.displayName = message.userInfo.displayName;
  message.channelName = channel.toLowerCase();
  message.internalTimestamp = new Date().getTime();
  message.serverTimestamp = new Date();
  message.serverTimestampRaw = new Date().getTime();
  message.isMod = message.userInfo.isMod;
  message.isLeadMod = message.userInfo.badges.has("lead_moderator");
  message.isStreamer = message.userInfo.isBroadcaster;
  if (message.isStreamer || message.isLeadMod) message.isMod = true;
  message.isVip = message.userInfo.isVip;
  message.isFirstMsg = message.isFirst;
  message.isSub = message.userInfo.isSubscriber;
  message.isAdmin = process.env.ADMIN_USERIDS.includes(message.senderUserID);
  message.originalArgs = message.originalMessageText.split(" ");
  message.args = message.messageText.split(" ");

  // check message waiters
  fb.utils.checkMessageWaiters(message);

  const channelData = await fb.db.get("config", {
    channelId: message.channelID,
  });

  Object.defineProperty(message, "prefix", {
    value: process.env.ENV === "prod" ? channelData?.prefix || "!" : "!!",
    writable: true,
    configurable: true,
    enumerable: true,
  });

  // handle listeners and commands
  commandHandler(message);
  listenerHandler(message);
};
