const { afkInfoObjects } = require("./afk_info_model.js");

const isAfkCommand = async (message) => {
  if (message.args.length === 1) {
    return {
      replyType: "reply",
      reply: `Use o formato: ${message.commandPrefix}isafk <usuário>`,
    };
  }

  const isAfkTarget = message.args[1]?.replace(/^@/, "").toLowerCase();

  let afkStats = await fb.db.get("afk", {
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
  const afkSince = fb.utils.relativeTime(afkStats.afk_since);

  return {
    replyType: "reply",
    reply: `${isAfkTarget} está ${afkAction} ${afkEmoji} há ${afkSince} ⌛ ${
      afkMessage ? `: ${afkMessage}` : ""
    }`,
  };
};

isAfkCommand.commandName = "isafk";
isAfkCommand.aliases = ["isafk"];
isAfkCommand.shortDescription =
  "Verifica o status de afk de algum usuário no canal atual";
isAfkCommand.cooldown = 5000;
isAfkCommand.cooldownType = "user";
isAfkCommand.whisperable = false;
isAfkCommand.description = `Veja se algum usuário está AFK e há quanto tempo no chat em que o comando foi executado`;
isAfkCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/src/commands/${__dirname
  .split("/")
  .pop()}/${__filename.split("/").pop()}`;

module.exports = {
  isAfkCommand,
};
