// TODO: get countline from rustlog clickhouse

const countlineCommand = async (message) => {
  const clTarget = message.args[1]?.replace(/^@/, "") || message.senderUsername;

  if (clTarget.toLowerCase() === "folhinhabot") {
    return {
      reply: `Para de tentar me contar Stare`,
      notes: `User tried to count folhinhabot messages`,
    };
  }

  if (clTarget.toLowerCase() === "top") {
    const clCurrChat = await fb.db.get("users", {
      [`msgCount.${message.channelName}`]: { $exists: true },
    });

    clCurrChat.sort(
      (a, b) =>
        b.msgCount[message.channelName] - a.msgCount[message.channelName]
    );

    // only top 5
    const top5 = clCurrChat.slice(0, 5);
    let reply = `Top 5 chatters desse chat: `;
    for (let i = 0; i < top5.length; i++) {
      const user = top5[i];
      const username = top5[i].currAlias;
      reply += `${i + 1}º ${username}: (${user.msgCount[message.channelName]})`;
      if (i !== top5.length - 1) {
        reply += ", ";
      }
    }

    let userPlacing;
    let userIndex;
    for (let i = 0; i < top5.length; i++) {
      if (top5[i].userid === message.senderUserID) {
        userPlacing = i + 1;
        userIndex = i;
        break;
      }
    }

    if (!userPlacing) {
      const userRank =
        clCurrChat.findIndex((user) => user.userid === message.senderUserID) +
        1;
      const userMsgCount = clCurrChat.find(
        (user) => user.userid === message.senderUserID
      ).msgCount[message.channelName];
      reply += `. Você está em ${userRank}º com ${userMsgCount} mensagens`;
    }

    const emote = await fb.emotes.getEmoteFromList(
      message.channelName,
      ["falamuito", "talkk", "peepotalk"],
      "🗣️"
    );

    return {
      reply: `${reply} ${emote}`,
      notes: `Top 5 chatters displayed for ${message.channelName}`,
    };
  }

  const clTargetID =
    clTarget !== message.senderUsername
      ? await fb.twitch.getUserID(clTarget)
      : message.senderUserID;

  if (!clTargetID) {
    return {
      reply: `O usuário ${clTarget} não existe`,
      notes: `User not found: ${clTarget}`,
    };
  }

  const clCount = await fb.db.get("users", { userid: clTargetID });
  if (clCount.length === 0) {
    return {
      reply: `Nunca vi esse usuário`,
      notes: `User never seen: ${clTarget}`,
    };
  }

  const msgCount = clCount[0].msgCount;
  let userMsgCount = 0;
  for (const channel in msgCount) {
    if (channel === message.channelName) {
      userMsgCount = msgCount[channel];
      break;
    }
  }

  // get channel total
  const channelTotal = await fb.db.get("users", {
    [`msgCount.${message.channelName}`]: { $exists: true },
  });

  let channelTotalCount = 0;
  for (const countChannel of channelTotal) {
    channelTotalCount += countChannel.msgCount[message.channelName];
  }

  if (userMsgCount === 0) {
    return {
      reply: `${clTarget} nunca falou neste chat`,
      notes: `User never spoke in channel: ${clTarget} in ${message.channelName}`,
    };
  }

  return {
    reply: `${clTarget} mandou ${userMsgCount.toLocaleString(
      "en-US"
    )} das ${channelTotalCount.toLocaleString(
      "en-US"
    )} mensagens totais deste chat`,
    notes: `Message count: ${clTarget} - ${userMsgCount}/${channelTotalCount} in ${message.channelName}`,
  };
};

countlineCommand.commandName = "countline";
countlineCommand.aliases = ["countline", "cl"];
countlineCommand.shortDescription =
  "Mostra a quantidade de mensagens de um usuário no chat atual";
countlineCommand.cooldown = 5000;
countlineCommand.cooldownType = "channel";
countlineCommand.whisperable = false;
countlineCommand.description = `Veja quantas mensagem você ou algum usuário já mandou no chat no qual o comando foi realizado

Pode também utilizar !countline top para ver o top 5 de pessoas que mais falaram no chat`;
countlineCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/src/commands/${__dirname
  .split("/")
  .pop()}/${__filename.split("/").pop()}`;

module.exports = {
  countlineCommand,
};
