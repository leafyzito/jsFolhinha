const { shouldSkipMessage } = require("./middleware");
const schedule = require("node-schedule");

let processingReminder = [];
let scheduledReminders = new Set(); // Track scheduled reminder IDs locally

// Helper function to format reminder message
const formatReminderMessage = (
  reminderSender,
  receiverName,
  howLongAgo,
  reminderMessage
) => {
  return reminderSender === receiverName
    ? `@${receiverName}, lembrete de você mesmo há ${howLongAgo}: ${reminderMessage}`
    : `@${receiverName}, lembrete de @${reminderSender} há ${howLongAgo}: ${reminderMessage}`;
};

// Helper function to send reminder and update database
const sendReminderAndUpdate = async (reminder, finalRes) => {
  // Get channel config from database
  const channelData = await fb.db.get("config", {
    channelID: reminder.fromChannelId,
  });

  if (!channelData) {
    // If no channel config found, send via whisper
    const receiverUser = await fb.api.helix.getUserByID(reminder.receiverId);
    if (receiverUser?.login) {
      await fb.log.whisper(receiverUser.login, finalRes);
    }
    return;
  }

  // Handle case where channelData might be an array or single document
  const channelConfig = Array.isArray(channelData)
    ? channelData[0]
    : channelData;
  const channelName = channelConfig.channel;

  // Check if channel is paused, reminders are banned, or offline-only with stream online
  const shouldSendViaWhisper =
    channelConfig.isPaused ||
    (channelConfig.disabledCommands &&
      channelConfig.disabledCommands.includes("remind")) ||
    (channelConfig.offlineOnly &&
      (await fb.api.helix.isStreamOnline(channelName)));

  if (shouldSendViaWhisper) {
    // Send in whisper if channel is paused, reminders are banned, or offline-only with stream online
    const receiverUser = await fb.api.helix.getUserByID(reminder.receiverId);
    if (receiverUser?.login) {
      await fb.log.whisper(receiverUser.login, finalRes);
    }
  } else {
    // Send in channel if channel is not paused, reminders are not banned, and not offline-only
    await fb.log.send(channelName, finalRes);
  }

  await fb.db.update(
    "remind",
    { _id: reminder._id },
    { $set: { beenRead: true } }
  );
};

// Function to handle missed reminders
const handleMissedReminder = async (reminder) => {
  const reminderDate = new Date(reminder.remindAt * 1000);

  fb.discord.log(
    `* Sending missed reminder to ${
      reminder.fromChannelId
    } (${reminderDate.toLocaleString()})`
  );
  console.log(
    `* Sending missed reminder to ${
      reminder.fromChannelId
    } (${reminderDate.toLocaleString()})`
  );

  const reminderSender =
    (await fb.api.helix.getUserByID(reminder.senderId))?.login ||
    "Usuário deletado";
  const receiverName =
    (await fb.api.helix.getUserByID(reminder.receiverId))?.login ||
    "Usuário deletado 2";
  const reminderHowLongAgo = fb.utils.relativeTime(reminder.remindTime, true);

  let finalRes = formatReminderMessage(
    reminderSender,
    receiverName,
    reminderHowLongAgo,
    reminder.remindMessage
  );

  if (finalRes.length > 480) {
    finalRes = await fb.utils.manageLongResponse(finalRes);
  }

  await sendReminderAndUpdate(reminder, finalRes);
};

// Function to schedule future reminders
const scheduleFutureReminder = async (reminder) => {
  const reminderDate = new Date(reminder.remindAt * 1000);

  console.log("* Setting timed reminder for " + reminderDate.toLocaleString());

  const job = schedule.scheduleJob(
    new Date(reminder.remindAt * 1000),
    async function () {
      // Verify the reminder has not been deleted externally, force check in db
      const remindDeletionCheck = await fb.db.get(
        "remind",
        { _id: reminder._id },
        true
      );
      if (!remindDeletionCheck || remindDeletionCheck.beenRead) {
        return;
      }

      const reminderSender =
        (await fb.api.helix.getUserByID(reminder.senderId))?.login ||
        "Usuário deletado";
      const receiverName =
        (await fb.api.helix.getUserByID(reminder.receiverId))?.login ||
        "Usuário deletado 2";
      const howLongAgo = fb.utils.relativeTime(reminder.remindTime, true);

      let finalRes = formatReminderMessage(
        reminderSender,
        receiverName,
        howLongAgo,
        reminder.remindMessage
      );

      if (finalRes.length > 480) {
        finalRes = await fb.utils.manageLongResponse(finalRes);
      }

      await sendReminderAndUpdate(reminder, finalRes);
    }
  );

  // Store the job in a global object to associate it with the reminderId
  if (!fb.reminderJobs) {
    fb.reminderJobs = {};
  }
  fb.reminderJobs[reminder._id] = job;
};

// Main function to load and process reminders
const loadReminders = async () => {
  const currentTime = Math.floor(Date.now() / 1000);

  try {
    const result = await fb.db.get("remind", { beenRead: false });

    for (const reminder of result) {
      // Handle scheduled reminders
      if (reminder.remindAt && !scheduledReminders.has(reminder._id)) {
        scheduledReminders.add(reminder._id);

        if (reminder.remindAt <= currentTime) {
          // Handle missed reminders
          await handleMissedReminder(reminder);
        } else {
          // Schedule future reminders
          await scheduleFutureReminder(reminder);
        }
      }
    }
  } catch (err) {
    console.log(`Error in reminder: ${err}`);
    if (fb.discord && fb.discord.logError) {
      fb.discord.logError(`Error in reminder: ${err}`);
    }
  }
};

// Function to handle reminder responses
const handleReminderResponse = async (message, reminders) => {
  // Add length property to single objects for compatibility
  if (!Array.isArray(reminders)) reminders.length = 1;

  if (reminders.length <= 3) {
    // Handle small number of reminders (≤3)
    let replyMsg = `${message.senderUsername}, você tem ${
      reminders.length
    } lembrete${reminders.length > 1 ? "s" : ""}: `;

    const firstThreeReminders = reminders.slice(0, 3);
    for (const reminder of firstThreeReminders) {
      const remindSender = await fb.api.helix.getUserByID(reminder.senderId);
      const remindTimeSince = fb.utils.relativeTime(reminder.remindTime, true);
      replyMsg +=
        ` @${
          remindSender?.login || "Usuário deletado"
        } (há ${remindTimeSince}): ${reminder.remindMessage}` +
        (reminder._id ===
        firstThreeReminders[firstThreeReminders.length - 1]._id
          ? ""
          : ";");
    }

    if (replyMsg.length > 480) {
      fb.log.send(
        message.channelName,
        `${message.senderUsername}, você tem ${reminders.length} lembretes. Acesse https://folhinhabot.com/reminders para ver os seus lembretes pendentes`
      );
      return;
    }

    fb.log.send(message.channelName, replyMsg);

    // Mark reminders as read
    for (const reminder of firstThreeReminders) {
      await fb.db.update(
        "remind",
        { _id: reminder._id },
        { $set: { beenRead: true } }
      );
    }

    return;
  }

  // Handle large number of reminders (>3)
  fb.log.send(
    message.channelName,
    `${message.senderUsername}, você tem ${reminders.length} lembretes. Acesse https://folhinhabot.com/reminders para ver os seus lembretes pendentes`
  );
};

// Main reminder listener function
const reminderListener = async (message) => {
  // Check if channel is paused or has reminders banned
  if (await shouldSkipMessage(message.channelID, "remind")) {
    return;
  }

  // Check if reminder is already being processed
  if (processingReminder.includes(message.senderUsername)) {
    return;
  }

  processingReminder.push(message.senderUsername);

  try {
    // Get user's pending reminders (immediate reminders only)
    const reminders = await fb.db.get(
      "remind",
      { receiverId: message.senderUserID, beenRead: false, remindAt: null },
      true
    );

    if (!reminders) {
      processingReminder = processingReminder.filter(
        (user) => user !== message.senderUsername
      );
      return;
    }

    // Handle the reminder response
    await handleReminderResponse(message, reminders);
  } catch (error) {
    console.error("Error processing reminder:", error);
  } finally {
    // Clean up processing state
    processingReminder = processingReminder.filter(
      (user) => user !== message.senderUsername
    );
  }
};

module.exports = {
  reminderListener,
  loadReminders,
};
