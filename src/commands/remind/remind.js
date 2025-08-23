// TODO: check
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

const remindCommand = async (message) => {
  if (message.args.length === 1) {
    return {
      reply: `Use o formato: ${message.prefix}remind <usuário> <mensagem>`,
    };
  }

  const targetUser = message.args[1]?.replace(/^@/, "").toLowerCase();

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

    return {
      reply: `Lembrete apagado ${emote}`,
    };
  }

  if (["show", "open"].includes(targetUser)) {
    if (message.args.length === 2) {
      const remindInfo = await fb.db.get("remind", {
        receiverId: message.senderUserID,
        beenRead: false,
        remindAt: null,
      });

      const pendingReminders = remindInfo.map((reminder) => reminder._id);
      const finalRes = `Você tem estes lembretes: ${pendingReminders.join(
        ", "
      )}`;

      return {
        reply: finalRes,
      };
    }

    const reminderId = message.args[2];

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

    const reminderSender =
      (await fb.api.helix.getUserByID(reminder.senderId)?.displayName) ||
      "Usuário deletado";
    const finalRes = `Lembrete de @${reminderSender} há ${fb.utils.relativeTime(
      reminder.remindTime,
      true,
      true
    )}: ${reminder.remindMessage}`;

    await fb.db.update(
      "remind",
      { _id: parseInt(reminderId) },
      { $set: { beenRead: true } }
    );

    return {
      reply: finalRes,
    };
  }

  if (["me", message.senderUsername].includes(targetUser)) {
    // Create reminder for self
    const remindMessage = message.args.slice(2).join(" ").trim();

    if (!remindMessage) {
      return {
        reply: `Você precisa fornecer uma mensagem para o lembrete`,
      };
    }

    const newRemindId = await newRemind(
      message,
      message.senderUserID,
      remindMessage,
      null
    );

    const emote = await fb.emotes.getEmoteFromList(
      message.channelName,
      ["noted"],
      "📝"
    );

    return {
      reply: `Vou lembrar você disso assim que falar no chat ${emote} (ID ${newRemindId})`,
    };
  }

  // Create reminder for another user
  const targetUserId = await fb.api.helix.getUserByUsername(targetUser)?.id;
  if (!targetUserId) {
    return {
      reply: `Esse usuário não existe`,
    };
  }

  const remindMessage = message.args.slice(2).join(" ").trim();
  if (!remindMessage) {
    return {
      reply: `Você precisa fornecer uma mensagem para o lembrete`,
    };
  }

  const newRemindId = await newRemind(
    message,
    targetUserId,
    remindMessage,
    null
  );

  const emote = await fb.emotes.getEmoteFromList(
    message.channelName,
    ["noted"],
    "📝"
  );

  return {
    reply: `Vou lembrar @${targetUser} disso assim que falar no chat ${emote} (ID ${newRemindId})`,
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
Este comando funciona independetemente do chat em que esteja

• Exemplo: !remind me Faz aquilo lá - O bot irá lembrar de "Fazer aquilo lá" a pessoa que executou o comando assim que voltar a falar em qualquer chat

• Exemplo: !remind @leafyzito Faz aquilo lá - O bot irá lembrar @leafyzito de "Fazer aquilo lá" assim que @leafyzito falar no chat

Para ver seus lembretes pendentes: !remind show
Para ver um lembrete específico: !remind show <ID>
Para apagar um lembrete: !remind delete <ID>`;
remindCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/src/commands/${__dirname
  .split("/")
  .pop()}/${__filename.split("/").pop()}`;

module.exports = {
  remindCommand,
};
