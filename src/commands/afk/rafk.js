const path = require("path");
const { afkInfoObjects } = require("./afk_info_model.js");

const rafkCommand = async (message) => {
  let afkStats = await fb.db.get("afk", {
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

  const deltaTime = fb.utils.unix() - afkStats.afk_return;
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
      reply: `Você só pode usar o comando ${message.prefix}rafk 3 vezes por vez`,
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

rafkCommand.commandName = "resumeafk";
rafkCommand.aliases = ["resumeafk", "rafk"];
rafkCommand.shortDescription =
  "Retome o seu status afk anterior no canal atual";
rafkCommand.cooldown = 5000;
rafkCommand.cooldownType = "user";
rafkCommand.whisperable = false;
rafkCommand.description = `Para o caso de ter voltado a falar em um canal no qual estava com status de AFK e queira voltar a ficar AFK, poderá usar !resumeafk
Este comando poderá apenas ser usado nos primeiros 5 minutos de ter voltado do seu estado de AFK
Caso contrário, para voltar a ficar AFK, use o comando !afk

Para evitar spam de !rafk, o AFK tem um limite de quantos !rafk podem ser usados, sendo esse limite de 3 usos apenas`;
rafkCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/src/commands/${__dirname.split(path.sep).pop()}/${__filename.split(path.sep).pop()}`;

module.exports = {
  rafkCommand,
};
