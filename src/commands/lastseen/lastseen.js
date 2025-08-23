const lastSeenCommand = async (message) => {
  if (message.args.length === 1) {
    return {
      reply: `Use o formato: ${message.prefix}lastseen <usuário>`,
    };
  }

  const targetUser = message.args[1].toLowerCase().replace(/^@/, "");

  if (targetUser === message.senderUsername) {
    return {
      reply: `Você tá aqui mesmo Stare`,
    };
  }

  if (["folhinha", "folhinhabot"].includes(targetUser)) {
    return {
      reply: `Eu tô aqui Stare`,
    };
  }

  const targetUserId = (await fb.api.helix.getUserByUsername(targetUser))?.id;
  if (!targetUserId) {
    return {
      reply: `Esse usuário não existe`,
    };
  }

  const userInfo = await fb.db.get("users", { userid: targetUserId });
  if (!userInfo) {
    return {
      reply: `Nunca vi esse usuário`,
    };
  }

  if (userInfo.optoutLs) {
    return {
      reply: `Esse usuário optou por não ser alvo de comandos lastseen 🚫`,
    };
  }

  const lsDate = userInfo.lsDate;
  const timeSinceLs = fb.utils.relativeTime(lsDate, true);

  return {
    reply: `${targetUser} foi visto pela última vez num chat há ${timeSinceLs}`,
  };
};

lastSeenCommand.commandName = "lastseen";
lastSeenCommand.aliases = ["lastseen", "ls"];
lastSeenCommand.shortDescription =
  "Mostra quando alguém foi visto em algum chat pela última vez";
lastSeenCommand.cooldown = 5000;
lastSeenCommand.cooldownType = "channel";
lastSeenCommand.whisperable = false;
lastSeenCommand.description = `Pesquise há quanto tempo um usuário foi visto pela última vez em algum canal onde o Folhinha esteja presente

Se quiser desabilitar a função de outras pessoas usarem este comando em você, use !optout lastseen`;
lastSeenCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/src/commands/${__dirname
  .split("/")
  .pop()}/${__filename.split("/").pop()}`;

module.exports = {
  lastSeenCommand,
};
