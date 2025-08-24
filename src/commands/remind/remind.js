// TODO: check and test
const schedule = require("node-schedule");

async function newRemind(message, targetId, remindMessage, remindAt) {
  const newRemindId = (await fb.db.count("remind", {}, true)) + 1;
  const remindInfo = {
    _id: newRemindId,
    senderId: message.senderUserID,
    receiverId: targetId,
    fromChannelId: message.channelID,
    remindMessage: remindMessage,
    remindTime: Math.floor(Date.now() / 1000),
    remindAt: remindAt,
    beenRead: false,
  };

  await fb.db.insert("remind", remindInfo);
  return newRemindId;
}

// Helper function to format time parts for display
const formatTimeParts = (totalSeconds) => {
  const timeParts = [];
  const days = Math.floor(totalSeconds / (24 * 60 * 60));
  const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) timeParts.push(`${days}d`);
  if (hours > 0) timeParts.push(`${hours}h`);
  if (minutes > 0) timeParts.push(`${minutes}m`);
  if (seconds > 0) timeParts.push(`${seconds}s`);

  return timeParts.join(" ");
};

// Helper function to check if user can receive reminders
const canUserReceiveReminders = async (targetUserId, senderUserID) => {
  const targetUserInfo = await fb.db.get("users", { userid: targetUserId });
  if (!targetUserInfo) return { canReceive: true }; // Default to true if user not found

  if (targetUserInfo.optoutRemind) {
    return { canReceive: false, reason: "optout" };
  }

  if (targetUserInfo.blocks && targetUserInfo.blocks.remind) {
    if (targetUserInfo.blocks.remind.includes(senderUserID)) {
      return { canReceive: false, reason: "blocked" };
    }
  }

  return { canReceive: true };
};

// Helper function to create scheduled reminder job
const createScheduledReminderJob = (
  remindAt,
  newRemindId,
  message,
  targetUser,
  targetUserId,
  remindMessage
) => {
  return schedule.scheduleJob(new Date(remindAt * 1000), async function () {
    // Verify the reminder has not been deleted externally
    const remindCheck = await fb.db.get("remind", { _id: newRemindId }, true);
    if (!remindCheck || remindCheck.beenRead) {
      return;
    }

    const reminderSender = await fb.api.helix.getUserByID(message.senderUserID);
    const reminderTime = fb.utils.relativeTime(remindCheck.remindTime, true);

    let finalRes =
      reminderSender?.login === targetUser
        ? `@${targetUser}, lembrete de você mesmo há ${reminderTime}: ${remindMessage}`
        : `@${targetUser}, lembrete de @${
            reminderSender?.login || "Usuário deletado"
          } há ${reminderTime}: ${remindMessage}`;

    if (finalRes.length > 480) {
      finalRes = await fb.utils.manageLongResponse(finalRes);
    }

    // Check channel configuration and send appropriately
    const channelData = await fb.db.get("config", {
      channelId: message.channelID,
    });
    if (channelData) {
      const channelName = channelData.channel;

      const shouldSendViaWhisper =
        channelData.isPaused ||
        (channelData.disabledCommands &&
          channelData.disabledCommands.includes("remind")) ||
        (channelData.offlineOnly &&
          (await fb.api.helix.isStreamOnline(channelName)));

      if (shouldSendViaWhisper) {
        await fb.log.whisper(targetUserId, finalRes);
      } else {
        fb.log.send(channelName, finalRes);
      }
    } else {
      // Fallback to whisper if no channel config
      await fb.log.whisper(targetUserId, finalRes);
    }

    await fb.db.update(
      "remind",
      { _id: newRemindId },
      { $set: { beenRead: true } }
    );
  });
};

const remindCommand = async (message) => {
  if (message.args.length === 1) {
    return {
      reply: `Use o formato: ${message.prefix}remind <usuário> <mensagem>`,
    };
  }

  let targetUser = message.args[1]?.replace(/^@/, "").toLowerCase();

  // MARKER: delete
  if (["del", "delete", "apagar"].includes(targetUser)) {
    const reminderId = message.args[2];

    if (isNaN(reminderId)) {
      return {
        reply: `Use o formato: ${message.prefix}remind delete <ID do lembrete>`,
      };
    }

    const remindInfo = await fb.db.get("remind", { _id: parseInt(reminderId) });
    if (!remindInfo) {
      return {
        reply: `Não existe nenhum lembrete com esse ID`,
      };
    }

    const reminder = remindInfo;
    if (reminder.beenRead) {
      return {
        reply: `Esse lembrete já foi aberto`,
      };
    }

    if (reminder.senderId !== message.senderUserID) {
      return {
        reply: `Você não é o criador desse lembrete`,
      };
    }

    const emote = await fb.emotes.getEmoteFromList(
      message.channelName,
      ["joia", "jumilhao"],
      "👍"
    );

    await fb.db.update(
      "remind",
      { _id: parseInt(reminderId) },
      { $set: { beenRead: true } }
    );

    // Cancel the scheduled job if it exists
    if (fb.reminderJobs && fb.reminderJobs[reminderId]) {
      fb.reminderJobs[reminderId].cancel();
      delete fb.reminderJobs[reminderId];
    }

    return {
      reply: `Lembrete apagado ${emote}`,
    };
  }

  // MARKER: show
  if (["show", "open"].includes(targetUser)) {
    if (message.args.length === 2) {
      const remindInfo = await fb.db.get("remind", {
        receiverId: message.senderUserID,
        beenRead: false,
        remindAt: null,
      });

      if (!remindInfo || remindInfo.length === 0) {
        return {
          reply: `Você não tem lembretes pendentes`,
        };
      }

      const pendingReminders = remindInfo.map((reminder) => reminder._id);
      const finalRes = `Você tem estes lembretes: ${pendingReminders.join(
        ", "
      )}`;

      return {
        reply: finalRes,
      };
    }

    const reminderId = message.args[2];

    // MARKER: show all
    if (reminderId === "all") {
      const remindInfo = await fb.db.get("remind", {
        receiverId: message.senderUserID,
        beenRead: false,
      });

      if (!remindInfo || remindInfo.length === 0) {
        return {
          reply: `Você não tem lembretes pendentes`,
        };
      }

      let pendingReminders = "";
      const reminderSenders = {};

      for (const reminder of remindInfo) {
        if (!reminderSenders[reminder.senderId]) {
          const reminderSender = await fb.api.helix.getUserByID(
            reminder.senderId
          );
          reminderSenders[reminder.senderId] =
            reminderSender?.login || "Usuário deletado";
        }

        pendingReminders += `ID: ${reminder._id} de @${
          reminderSenders[reminder.senderId]
        } há ${fb.utils.relativeTime(reminder.remindTime, true)}:\n${
          reminder.remindMessage
        }\n\n`;
      }

      const gistUrl = await fb.utils.createNewGist(pendingReminders);

      // Mark all reminders as read
      await fb.db.updateMany(
        "remind",
        { receiverId: message.senderUserID },
        { $set: { beenRead: true } }
      );

      return {
        reply: `Para ver todos os seus lembretes, acesse: ${gistUrl}`,
      };
    }

    // MARKER: show specific
    if (isNaN(reminderId)) {
      return {
        reply: `Use o formato: ${message.prefix}remind show <ID do lembrete>`,
      };
    }

    const remindInfo = await fb.db.get("remind", {
      _id: parseInt(reminderId),
      beenRead: false,
    });

    if (!remindInfo) {
      return {
        reply: `Não existe nenhum lembrete pendente com esse ID`,
      };
    }

    const reminder = remindInfo;
    if (
      reminder.receiverId !== message.senderUserID &&
      reminder.senderId !== message.senderUserID
    ) {
      return {
        reply: `Você não é o criador nem o destinatário desse lembrete`,
      };
    }

    const reminderSender = await fb.api.helix.getUserByID(reminder.senderId);
    const finalRes = `Lembrete de @${
      reminderSender?.login || "Usuário deletado"
    } há ${fb.utils.relativeTime(reminder.remindTime, true)}: ${
      reminder.remindMessage
    }`;

    await fb.db.update(
      "remind",
      { _id: parseInt(reminderId) },
      { $set: { beenRead: true } }
    );

    return {
      reply: finalRes,
    };
  }

  // MARKER: block
  if (["block", "bloquear"].includes(targetUser)) {
    const targetUsername = message.args[2]?.replace(/^@/, "");
    if (!targetUsername) {
      return {
        reply: `Use o formato: ${message.prefix}remind block <usuário>`,
      };
    }

    const targetUserId = (await fb.api.helix.getUserByUsername(targetUsername))
      ?.id;
    if (!targetUserId) {
      return {
        reply: `Esse usuário não existe`,
      };
    }

    if (targetUserId === message.senderUserID) {
      return {
        reply: `Você não pode se bloquear a você mesmo Stare`,
      };
    }

    await fb.db.update(
      "users",
      { userid: message.senderUserID },
      { $push: { "blocks.remind": targetUserId } }
    );

    return {
      reply: `Você bloqueou ${targetUsername} de usar comandos remind para você`,
    };
  }

  // MARKER: unblock
  if (["unblock", "desbloquear"].includes(targetUser)) {
    const targetUsername = message.args[2]?.replace(/^@/, "");
    if (!targetUsername) {
      return {
        reply: `Use o formato: ${message.prefix}remind unblock <usuário>`,
      };
    }

    const targetUserId = (await fb.api.helix.getUserByUsername(targetUsername))
      ?.id;
    if (!targetUserId) {
      return {
        reply: `Esse usuário não existe`,
      };
    }

    if (targetUserId === message.senderUserID) {
      return {
        reply: `Você não pode se desbloquear a você mesmo Stare`,
      };
    }

    await fb.db.updateMany(
      "users",
      { userid: message.senderUserID },
      { $pull: { "blocks.remind": targetUserId } }
    );

    return {
      reply: `Você desbloqueou ${targetUsername} de usar comandos remind para você`,
    };
  }

  if (["folhinha", "folhinhabot"].includes(targetUser)) {
    return {
      reply: `Stare que foi ow`,
    };
  }

  // MARKER: main reminder logic
  // Handle "me" or self-reminder
  if (["me", message.senderUsername].includes(targetUser)) {
    targetUser = message.senderUsername;
  }

  // Check if it's a timed reminder
  let totalSeconds = 0;
  let remindMessage = "";
  let remindAt = null;

  // Look for "in" keyword and parse time
  const inIndex = message.args.findIndex((arg) => arg.toLowerCase() === "in");
  if (inIndex !== -1 && inIndex + 1 < message.args.length) {
    const timeParts = message.args.slice(inIndex + 1);
    let timeIndex = 0;
    let days = null;
    let hours = null;
    let minutes = null;
    let seconds = null;

    // Parse time units by checking each part and incrementing index
    if (
      timeParts[timeIndex] &&
      ["d", "day", "days", "dia", "dias"].some((suffix) =>
        timeParts[timeIndex].toLowerCase().endsWith(suffix)
      )
    ) {
      days = timeParts[timeIndex];
      if (!isNaN(parseInt(days))) timeIndex++;
    }

    if (
      timeParts[timeIndex] &&
      ["h", "hrs", "hour", "hours", "hora", "horas"].some((suffix) =>
        timeParts[timeIndex].toLowerCase().endsWith(suffix)
      )
    ) {
      hours = timeParts[timeIndex];
      if (!isNaN(parseInt(hours))) timeIndex++;
    }

    if (
      timeParts[timeIndex] &&
      ["m", "min", "mins", "minute", "minutes", "minuto", "minutos"].some(
        (suffix) => timeParts[timeIndex].toLowerCase().endsWith(suffix)
      )
    ) {
      minutes = timeParts[timeIndex];
      if (!isNaN(parseInt(minutes))) timeIndex++;
    }

    if (
      timeParts[timeIndex] &&
      ["s", "sec", "secs", "second", "seconds", "segundo", "segundos"].some(
        (suffix) => timeParts[timeIndex].toLowerCase().endsWith(suffix)
      )
    ) {
      seconds = timeParts[timeIndex];
      if (!isNaN(parseInt(seconds))) timeIndex++;
    }

    // Calculate total seconds using the original parseTime function logic
    if (days && !isNaN(parseInt(days)))
      totalSeconds += parseInt(days) * 24 * 60 * 60;
    if (hours && !isNaN(parseInt(hours)))
      totalSeconds += parseInt(hours) * 60 * 60;
    if (minutes && !isNaN(parseInt(minutes)))
      totalSeconds += parseInt(minutes) * 60;
    if (seconds && !isNaN(parseInt(seconds))) totalSeconds += parseInt(seconds);

    if (totalSeconds === 0) {
      return {
        reply: `Use o formato: ${message.prefix}remind <usuário> in <tempo> <mensagem> (ex: in 10s/10m/10h/10d)`,
      };
    }

    if (totalSeconds < 60) {
      return {
        reply: `O tempo mínimo para lembretes cronometrados é de 1 minuto`,
      };
    }

    if (totalSeconds > 157_784_630) {
      // 5 years
      return {
        reply: `O tempo máximo para lembretes cronometrados é de 5 anos`,
      };
    }

    remindAt = Math.floor(Date.now() / 1000) + totalSeconds;
    remindMessage = message.args
      .slice(inIndex + 1 + timeIndex)
      .join(" ")
      .trim();
  } else {
    // Regular reminder (no time specified)
    remindMessage = message.args.slice(2).join(" ").trim();
  }

  if (!remindMessage) {
    remindMessage = "(sem mensagem)";
  }

  // Get target user ID
  const targetUserId = (await fb.api.helix.getUserByUsername(targetUser))?.id;
  if (!targetUserId) {
    return {
      reply: `Esse usuário não existe`,
    };
  }

  // Check user optout and reminder blocks
  const userCheck = await canUserReceiveReminders(
    targetUserId,
    message.senderUserID
  );
  if (!userCheck.canReceive) {
    if (userCheck.reason === "optout") {
      return {
        reply: `Esse usuário optou por não ser alvo de comandos remind 🚫`,
      };
    } else if (userCheck.reason === "blocked") {
      return {
        reply: `Você foi bloqueado por esse usuário para usar comandos remind 🚫`,
      };
    }
  }

  // Create the reminder
  const newRemindId = await newRemind(
    message,
    targetUserId,
    remindMessage,
    remindAt
  );

  const emote = await fb.emotes.getEmoteFromList(
    message.channelName,
    ["noted"],
    "📝"
  );

  // Format the response message
  let replyMessage = `Vou lembrar ${
    targetUser !== message.senderUsername ? `@${targetUser}` : "você"
  } disso `;

  if (remindAt) {
    // Timed reminder
    replyMessage += `em ${formatTimeParts(totalSeconds)} `;
  } else {
    // Regular reminder
    replyMessage += "assim que falar no chat ";
  }

  replyMessage += `${emote} (ID ${newRemindId})`;

  // If it's a scheduled reminder, create the job
  if (remindAt) {
    const job = createScheduledReminderJob(
      remindAt,
      newRemindId,
      message,
      targetUser,
      targetUserId,
      remindMessage
    );

    // Store the job
    if (!fb.reminderJobs) {
      fb.reminderJobs = {};
    }
    fb.reminderJobs[newRemindId] = job;
  }

  return {
    reply: replyMessage,
  };
};

remindCommand.commandName = "remind";
remindCommand.aliases = ["remind", "lembrar"];
remindCommand.shortDescription = "Deixe um lembrete para algum usuário do chat";
remindCommand.cooldown = 5000;
remindCommand.cooldownType = "user";
remindCommand.whisperable = false;
remindCommand.description = `Use este comando para deixar um lembrete para a próxima vez que um usuário falar no chat

Pode deixar um lembrete para si mesmo ou para outra pessoa
Este comando funciona independentemente do chat em que esteja

• Exemplo: !remind me Faz aquilo lá - O bot irá lembrar de "Fazer aquilo lá" a pessoa que executou o comando assim que voltar a falar em qualquer chat

• Exemplo: !remind @leafyzito Faz aquilo lá - O bot irá lembrar @leafyzito de "Fazer aquilo lá" assim que @leafyzito falar no chat

Pode também deixar lembretes cronometrados:
• Exemplo: !remind me in 10m Faz aquilo lá - O bot irá lembrar quem executou o comando de "Fazer aquilo lá" 10 minutos depois

• Exemplo: !remind @leafyzito in 15d 10h - @leafyzito será lembrado passado 15 dias e 10 horas

Para ver seus lembretes pendentes: !remind show
Para ver um lembrete específico: !remind show <ID>
Para ver todos os lembretes: !remind show all
Para apagar um lembrete: !remind delete <ID>
Para bloquear usuários: !remind block/unblock <usuário>`;
remindCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/src/commands/${__dirname
  .split("/")
  .pop()}/${__filename.split("/").pop()}`;

module.exports = {
  remindCommand,
};
