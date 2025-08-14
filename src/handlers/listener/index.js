const {
  replyMentionListener,
  notifyDevMentionListener,
} = require("./mention.js");
const { afkUserListener } = require("./afk.js");
const { reminderListener } = require("./reminder.js");
const { updateUserListener } = require("./updateUser.js");

function listenerHandler(message) {
  // Database caching is handled automatically, no need to wait for local cache loading

  notifyDevMentionListener(message).catch((err) => {
    console.log(`Error in notify dev mention listener: ${err}`);
    fb.discord.log(`* Error in notify dev mention listener: ${err}`);
  });

  if (message.senderUsername == process.env.BOT_USERNAME) {
    return;
  }

  replyMentionListener(message).catch((err) => {
    console.log(`Error in reply mention listener: ${err}`);
    fb.discord.log(`* Error in reply mention listener: ${err}`);
  });

  // if (process.env.NODE_ENV !== "prod") {
  //   return;
  // }

  afkUserListener(message).catch((err) => {
    console.log(`Error in afk listener: ${err}`);
    fb.discord.log(`* Error in afk listener: ${err}`);
  });

  reminderListener(message).catch((err) => {
    console.log(`Error in reminder listener: ${err}`);
    fb.discord.log(`* Error in reminder listener: ${err}`);
  });

  updateUserListener(message).catch((err) => {
    console.log(`Error in update user listener: ${err}`);
    fb.discord.log(`* Error in update user listener: ${err}`);
  });
}

module.exports = {
  listenerHandler,
};
