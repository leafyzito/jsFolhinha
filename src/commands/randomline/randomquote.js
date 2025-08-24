// TODO: OK - test
async function getRandomLine(userid, channelid) {
  const response = await fb.api.rustlog.getRandomLine(channelid, userid);

  if (!response) {
    return null;
  }

  // Parse the log line into components
  const regex = /\[(.*?)\] #(.*?) (.*?): (.*)/;
  const match = response.match(regex);

  if (!match) {
    return null;
  }

  const [, timestamp, channelName, user, message] = match;

  // Convert timestamp to Unix time (assuming timestamp is in format "YYYY-MM-DD HH:mm:ss")
  const unixTimestamp = Math.floor(new Date(timestamp).getTime() / 1000);

  return {
    channel: channelName,
    user: user,
    message: message,
    timeSince: fb.utils.relativeTime(unixTimestamp, true, true),
  };
}

const randomLineCommand = async (message) => {
  const targetUser =
    message.args[1]?.replace(/^@/, "") || message.senderUsername;
  const targetId =
    targetUser !== message.senderUsername
      ? await fb.api.helix.getUserByUsername(targetUser)?.id
      : message.senderUserID;

  const randomLine = await getRandomLine(targetId, message.channelID);
  if (!targetId && !randomLine) {
    return {
      reply: `Nunca loguei uma mensagem desse usuário neste chat (contando desde 06/03/2025)`,
    };
  }

  if (!randomLine) {
    // this should never happen
    return {
      reply: `Nunca loguei uma mensagem desse usuário neste chat (contando desde 06/03/2025). Se não for o caso, por favor contacte o @${process.env.DEV_NICK}`,
    };
  }

  return {
    reply: `(há ${randomLine.timeSince}) ${randomLine.user}: ${randomLine.message}`,
  };
};

randomLineCommand.commandName = "randomquote";
randomLineCommand.aliases = ["randomquote", "rq"];
randomLineCommand.shortDescription = "Veja uma mensagem aleatória sua";
randomLineCommand.cooldown = 5000;
randomLineCommand.cooldownType = "channel";
randomLineCommand.whisperable = false;
randomLineCommand.description = `Receba uma mensagem aleatória de um usuário fornecido ou, caso nenhum seja fornecido, da pessoa que executou o comando
  
  • Exemplo: !randomquote - O bot vai mostrar uma mensagem aleatória de quem executou o comando no chat onde o comando foi executado
  
  • Exemplo: !randomquote @leafyzito - O bot vai mostrar uma mensagem aleatória de @leafyzito no chat onde o comando foi executado
  
  Começou a contar desde 06/03/2025`;
randomLineCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/src/commands/${__dirname
  .split("/")
  .pop()}/${__filename.split("/").pop()}`;

module.exports = {
  randomLineCommand,
};
