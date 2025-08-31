async function getModList(user) {
  const api_url = `https://roles.tv/api/user/login/${user}`;
  const data = await fb.got(api_url);

  if (!data || (data.error && data.error != null)) {
    return null;
  }

  const mods = data.data.roles.moderators;
  const founders = data.data.roles.founders;
  const vips = data.data.roles.vips;
  const artists = data.data.roles.artists;
  const subscribers = data.data.roles.subscribers;
  const total = mods + founders + vips + artists + subscribers;

  return {
    mods,
    founders,
    vips,
    artists,
    subscribers,
    total,
  };
}

// Format numbers with commas
const formatNumber = (num) => num.toLocaleString("en-US");

const rolesCommand = async (message) => {
  const targetUser =
    message.args[1]?.replace(/^@/, "") || message.senderUsername;
  const userRoles = await getModList(targetUser);

  if (userRoles === null) {
    return {
      reply: `Esse usuário não existe`,
    };
  }

  if (userRoles.total === 0) {
    return {
      reply: `O usuário ${targetUser} não tem nenhum cargo`,
    };
  }

  // Build the response with emojis and formatting
  let response = `🔍 ${targetUser} tem ${formatNumber(
    userRoles.total
  )} cargos na Twitch`;

  if (userRoles.mods > 0)
    response += ` • 🛡️ Mod em ${formatNumber(userRoles.mods)}`;
  if (userRoles.vips > 0)
    response += ` • 🌟 VIP em ${formatNumber(userRoles.vips)}`;
  if (userRoles.founders > 0)
    response += ` • 👑 Founder em ${formatNumber(userRoles.founders)}`;
  if (userRoles.artists > 0)
    response += ` • 🎨 Artist em ${formatNumber(userRoles.artists)}`;
  if (userRoles.subscribers > 0)
    response += ` • 🎤 Sub em ${formatNumber(userRoles.subscribers)}`;

  response += ` - https://roles.tv/u/${targetUser.toLowerCase()}`;

  return {
    reply: response,
  };
};

rolesCommand.commandName = "roles";
rolesCommand.aliases = ["roles", "rlu"];
rolesCommand.shortDescription =
  "Mostra a lista de cargos que algum usuário tem por toda a Twitch";
rolesCommand.cooldown = 5000;
rolesCommand.cooldownType = "channel";
rolesCommand.whisperable = false;
rolesCommand.description = `Exibe uma lista de cargos que o usuário fornecido tem por toda a Twitch
    
    • Exemplo: !roles - Exibe a lista de cargos que o usuário que executou o comando tem por toda a Twitch
    • Exemplo: !roles {usuário} - Exibe a lista de cargos que o usuário fornecido tem por toda a Twitch
    
    Nota: De momento o site está a exibir informação não atualizada`;
rolesCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/src/commands/${__dirname
  .split("/")
  .pop()}/${__filename.split("/").pop()}`;

module.exports = {
  rolesCommand,
};
