const userCommand = async (message) => {
  const userTarget =
    message.args[1]?.replace(/^@/, "").toLowerCase() || message.senderUsername;

  const userInfo = await fb.api.ivr.getUser(userTarget);
  if (!userInfo) {
    return {
      reply: `Esse usuário não existe`,
    };
  }

  return {
    reply: `${
      userInfo.isBanned ? `🚫 Banido: ${userInfo.banReason} • ` : ""
    }  @${userInfo.displayName} • ID: ${userInfo.userId} • Cor: ${
      userInfo.chatColor
    } • Badge: ${userInfo.badge} • Chatters: ${
      userInfo.chatterCount
    } • Seguidores: ${userInfo.followers} • Criado há ${
      userInfo.createdHowLongAgo
    } (${userInfo.createdAt}) ${userInfo.isLive ? "• 🔴 Em live agora" : ""} ${
      userInfo.lastStream && !userInfo.isLive
        ? `• Última live: há ${userInfo.lastStream}`
        : ""
    }`,
  };
};

userCommand.commandName = "user";
userCommand.aliases = ["user", "u"];
userCommand.shortDescription = "Mostra informações gerais sobre um usuário";
userCommand.cooldown = 5000;
userCommand.cooldownType = "channel";
userCommand.whisperable = true;
userCommand.description = `Exibe várias informações sobre quem executou o comando ou sobre o usuário fornecido

Informações a serem exibidas: Nick, ID, Cor, Badge, Chatters no canal, Seguidores e Tempo de criação da conta`;
userCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/src/commands/${__dirname
  .split("/")
  .pop()}/${__filename.split("/").pop()}`;

module.exports = {
  userCommand,
};
