async function getVipList(user) {
  const api_url = `https://roles.tv/api/summary/vips/login/${user}`;
  const data = await fb.got(api_url);

  if (!data || (data.error && data.error != null)) {
    return null;
  }

  const totalVips = data.data.channels;
  const totalPartners = data.data.partners;
  const totalAffiliates = data.data.affiliates;
  const totalFollowers = data.data.channelsTotalFollowers;

  return {
    totalVips,
    totalPartners,
    totalAffiliates,
    totalFollowers: totalFollowers.toLocaleString("en-US"),
  };
}

const vipListCommand = async (message) => {
  const targetUser =
    message.args[1]?.replace(/^@/, "") || message.senderUsername;
  const userVipList = await getVipList(targetUser);

  if (userVipList === null) {
    return {
      reply: `Esse usuário não existe`,
    };
  }

  if (userVipList.totalVips === 0) {
    return {
      reply: `O usuário ${targetUser} não é vip em nenhum canal`,
    };
  }

  return {
    reply: `${targetUser} é VIP em ${userVipList.totalVips} canais | ${
      userVipList.totalPartners
    } Parceiros | ${userVipList.totalAffiliates} Afiliados | ${
      userVipList.totalFollowers
    } Seguidores no total - https://roles.tv/u/${targetUser.toLowerCase()}`,
  };
};

vipListCommand.commandName = "viplist";
vipListCommand.aliases = ["viplist", "vipslist", "vl"];
vipListCommand.shortDescription =
  "Mostra a lista de canais que algum usuário é vip";
vipListCommand.cooldown = 5000;
vipListCommand.cooldownType = "channel";
vipListCommand.whisperable = false;
vipListCommand.description = `Exibe uma lista de canais onde o usuário fornecido é vip, quantos desses canais são parceiros, afiliados e a soma total de seguidores de todos os canais

• Exemplo: !viplist - Exibe a lista de canais que o usuário que executou o comando é moderador
• Exemplo: !viplist {usuário} - Exibe a lista de canais que o usuário fornecido é moderador

Nota: De momento o site está a exibir informação não atualizada`;
vipListCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/src/commands/${__dirname
  .split("/")
  .pop()}/${__filename.split("/").pop()}`;

module.exports = {
  vipListCommand,
};
