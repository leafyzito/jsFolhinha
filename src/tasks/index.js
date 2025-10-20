// scheduled in main.js
const dailyCookieResetTask = require("./dailyCookieReset");

// recurring tasks
const {
  startPetTask,
  startFetchPendingJoinsTask,
  // startRejoinDisconnectedChannelsTask,
  startDiscordPresenceTask,
} = require("./taskScheduler");

// Function to start all recurring tasks
const startAllTasks = () => {
  // Start recurring tasks
  if (process.env.ENV == "prod") {
    console.log("* Starting production tasks");
    const cron = require("node-cron");
    cron.schedule("0 9 * * *", async () => {
      await dailyCookieResetTask();
    });
    startPetTask();
    startFetchPendingJoinsTask();
  }
  // startRejoinDisconnectedChannelsTask();
  startDiscordPresenceTask();
};

module.exports = {
  dailyCookieResetTask,
  startPetTask,
  startFetchPendingJoinsTask,
  // startRejoinDisconnectedChannelsTask,
  startDiscordPresenceTask,
  startAllTasks,
};
