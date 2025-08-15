const { afkInfoObjects } = require("./afk_info_model.js");

var afkAliasList = [];
afkInfoObjects.forEach((afk) => {
  afkAliasList = afkAliasList.concat(afk.alias);
});

async function createAfkBase(message) {
  const insert_base_afk_doc = {
    channel: message.channelName,
    user: message.senderUsername,
    is_afk: false,
    afk: null,
    afk_message: null,
    afk_since: 0,
    afk_return: 0,
    afk_type: null,
    rafk_counter: 0,
  };

  await fb.db.insert("afk", insert_base_afk_doc);
}

const afkCommand = async (message) => {
  const commandInvoker = message.messageText
    .split(" ")[0]
    .split(`${message.commandPrefix}`)[1]
    .trim()
    .toLowerCase();
  const afkInfoObject = afkInfoObjects.find((afk) =>
    afk.alias.includes(commandInvoker)
  );

  const afkStats = await fb.db.get("afk", {
    channel: message.channelName,
    user: message.senderUsername,
  });

  if (!afkStats) {
    await createAfkBase(message);
  }

  var afkMessage = message.messageText.split(" ").slice(1).join(" ");
  if (afkMessage.length > 400) {
    afkMessage = afkMessage.slice(0, 400) + "...";
  }

  const afkType = afkInfoObject.alias[0];
  const afkAction = afkInfoObject.afk;
  const afkEmoji = afkInfoObject.emoji;

  await fb.db.update(
    "afk",
    { channel: message.channelName, user: message.senderUsername },
    {
      $set: {
        is_afk: true,
        afk_message: afkMessage,
        afk_since: fb.utils.unix(),
        afk_type: afkType,
        rafk_counter: 0,
      },
    }
  );

  return {
    replyType: "reply",
    reply: `${message.senderUsername} ${afkAction} ${afkEmoji} ${
      afkMessage ? `: ${afkMessage}` : ""
    }`,
  };
};

const rafkCommand = async (message) => {
  var afkStats = await fb.db.get("afk", {
    channel: message.channelName,
    user: message.senderUsername,
  });

  if (!afkStats) {
    return {
      replyType: "reply",
      reply: `Você nunca esteve afk aqui antes`,
    };
  }

  // Handle case where afkStats might be an array or single document
  if (Array.isArray(afkStats)) {
    afkStats = afkStats[0];
  }

  var deltaTime = fb.utils.unix() - afkStats.afk_return;
  if (deltaTime > 300) {
    return {
      replyType: "reply",
      reply: `Já se passaram mais de 5 minutos desde que você voltou`,
    };
  }

  if (afkStats.rafk_counter >= 4) {
    // simply ignore
    return;
  }
  if (afkStats.rafk_counter >= 3) {
    await fb.db.update(
      "afk",
      { channel: message.channelName, user: message.senderUsername },
      { $set: { rafk_counter: afkStats.rafk_counter + 1 } }
    );

    return {
      replyType: "reply",
      reply: `Você só pode usar o comando ${message.commandPrefix}rafk 3 vezes por vez`,
    };
  }

  const afkInfoObject = afkInfoObjects.find((afk) =>
    afk.alias.includes(afkStats.afk_type)
  );
  const afkAction = afkInfoObject.rafk;
  const afkEmoji = afkInfoObject.emoji;

  await fb.db.update(
    "afk",
    { channel: message.channelName, user: message.senderUsername },
    { $set: { is_afk: true, rafk_counter: afkStats.rafk_counter + 1 } }
  );

  return {
    replyType: "reply",
    reply: `${message.senderUsername} voltou ${afkAction} ${afkEmoji} ${
      afkStats.afk_message ? `: ${afkStats.afk_message}` : ""
    }`,
  };
};

const isAfkCommand = async (message) => {
  if (message.messageText.split(" ").length === 1) {
    return {
      replyType: "reply",
      reply: `Use o formato: ${message.commandPrefix}isafk <usuário>`,
    };
  }

  const isAfkTarget = message.messageText
    .split(" ")[1]
    ?.replace(/^@/, "")
    .toLowerCase();

  var afkStats = await fb.db.get("afk", {
    channel: message.channelName,
    user: isAfkTarget,
  });
  if (!afkStats) {
    return {
      replyType: "reply",
      reply: `${isAfkTarget} nunca esteve afk aqui antes`,
    };
  }

  // Handle case where afkStats might be an array or single document
  if (Array.isArray(afkStats)) {
    afkStats = afkStats[0];
  }

  if (!afkStats.is_afk) {
    return {
      replyType: "reply",
      reply: `${isAfkTarget} não está afk`,
    };
  }

  const afkInfoObject = afkInfoObjects.find((afk) =>
    afk.alias.includes(afkStats.afk_type)
  );
  const afkAction = afkInfoObject.isafk;
  const afkEmoji = afkInfoObject.emoji;
  const afkMessage = afkStats.afk_message;
  var afkSince = fb.utils.relativeTime(afkStats.afk_since);

  return {
    replyType: "reply",
    reply: `${isAfkTarget} está ${afkAction} ${afkEmoji} há ${afkSince} ⌛ ${
      afkMessage ? `: ${afkMessage}` : ""
    }`,
  };
};

afkCommand.commandName = "afk";
afkCommand.aliases = [...afkAliasList];
afkCommand.shortDescription =
  "Fique com status afk para contar quanto tempo esteve fora no canal atual";
afkCommand.cooldown = 5000;
afkCommand.cooldownType = "user";
afkCommand.whisperable = false;
afkCommand.description = `Registra seu status como AFK no canal onde o comando foi realizado. Após você enviar qualquer mensagem no canal ficou AFK, o Folhinha responderá indicando quanto tempo você esteve ausente juntamente com a sua mensagem, caso tenha deixado uma

Esse comando não afetará seu estado de AFK em outros canais

Além de AFK, você poderá escolher entre uma variedade de ações, como !ler ou !desenhar, que terão o mesmo efeito do AFK, mas com uma mensagem diferente.

Nos aliases do comando poderá ver todas as opções de ações disponíveis`;
afkCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/src/commands/${afkCommand.commandName}/${afkCommand.commandName}.js`;

rafkCommand.commandName = "resumeafk";
rafkCommand.aliases = [rafkCommand.commandName, "rafk"];
rafkCommand.shortDescription =
  "Retome o seu status afk anterior no canal atual";
rafkCommand.cooldown = 5000;
rafkCommand.cooldownType = "user";
rafkCommand.whisperable = false;
rafkCommand.description = `Para o caso de ter voltado a falar em um canal no qual estava com status de AFK e queira voltar a ficar AFK, poderá usar !resumeafk
Este comando poderá apenas ser usado nos primeiros 5 minutos de ter voltado do seu estado de AFK
Caso contrário, para voltar a ficar AFK, use o comando !afk

Para evitar spam de !rafk, o AFK tem um limite de quantos !rafk podem ser usados, sendo esse limite de 3 usos apenas`;
rafkCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/src/commands/${afkCommand.commandName}/${afkCommand.commandName}.js`;

isAfkCommand.commandName = "isafk";
isAfkCommand.aliases = [isAfkCommand.commandName];
isAfkCommand.shortDescription =
  "Verifica o status de afk de algum usuário no canal atual";
isAfkCommand.cooldown = 5000;
isAfkCommand.cooldownType = "user";
isAfkCommand.whisperable = false;
isAfkCommand.description = `Veja se algum usuário está AFK e há quanto tempo no chat em que o comando foi executado`;
isAfkCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/src/commands/${afkCommand.commandName}/${afkCommand.commandName}.js`;

module.exports = {
  afkCommand,
  rafkCommand,
  isAfkCommand,
};
