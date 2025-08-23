async function getAllNicks(userId) {
  const api_url = `https://logs.spanix.team/namehistory/${userId}`;
  const data = await fb.got(api_url);

  if (!data) {
    return null;
  }

  // Sort the data by first_timestamp in ascending order
  const sortedData = data.sort(
    (a, b) => new Date(a.first_timestamp) - new Date(b.first_timestamp)
  );

  const nicks = sortedData.map((nick) => nick.user_login);
  return nicks;
}

const nicksCommand = async (message) => {
  const nicksTarget =
    message.args[1]?.replace(/^@/, "").toLowerCase() || message.senderUsername;

  let targetId = null;

  // to allow searching for old nicks
  const userDbInfo = await fb.db.get("users", { aliases: nicksTarget });
  if (userDbInfo) {
    targetId = userDbInfo.userid;
  } else {
    targetId = (await fb.api.helix.getUserByUsername(nicksTarget))?.id;
  }

  if (!targetId) {
    return {
      reply: `Esse usuário não existe`,
    };
  }

  const aliases = await getAllNicks(targetId);
  if (!aliases) {
    return {
      reply: `Erro ao buscar histórico de nicks`,
    };
  }

  let response = `${
    nicksTarget === message.senderUsername
      ? `O seu histórico de nicks é:`
      : `O histórico de nicks de ${nicksTarget} (id: ${targetId}) é:`
  } ${aliases.join(" → ")}`;

  if (response.length > 490) {
    response = response.substring(0, 487) + "...";
  }

  return {
    reply: response,
  };
};

nicksCommand.commandName = "nick";
nicksCommand.aliases = ["nick", "nicks", "namehistory", "nickhistory"];
nicksCommand.shortDescription = "Mostra o histórico de nicks de algum usuário";
nicksCommand.cooldown = 5000;
nicksCommand.cooldownType = "channel";
nicksCommand.whisperable = true;
nicksCommand.description = `Exibe o histórico de nicks de um usuário ou de quem executou o comando caso nenhum usuário seja fornecido

• Exemplo: !nicks @leafyzito - O bot irá responder com o histórico de nicks de leafyzito`;
nicksCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/src/commands/${__dirname
  .split("/")
  .pop()}/${__filename.split("/").pop()}`;

module.exports = {
  nicksCommand,
};
