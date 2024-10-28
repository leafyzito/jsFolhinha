const { processCommand } = require("../../utils/processCommand.js");

async function getVipList(user) {
    const api_url = `https://roles.tv/api/user/login/${user}`;
    const response = await fetch(api_url);
    const data = await response.json();

    if (data.statusCode === 404) {
        return null;
    }

    const totalVips = data.data.roles.vips.total;
    let totalPartners = 0;
    let totalAffiliates = 0;
    let totalFollowers = 0;

    data.data.roles.vips.list.forEach((item) => {
        if (item.roles.isPartner) {
            totalPartners++;
        }
        if (item.roles.isAffiliate) {
            totalAffiliates++;
        }
        if (item.followers) {
            totalFollowers += item.followers;
        }
    });

    return { totalPartners, totalVips, totalAffiliates, totalFollowers: totalFollowers.toLocaleString('en-US') };
}

const vipListCommand = async (client, message) => {
    message.command = 'viplist';
    if (!await processCommand(5000, 'channel', message, client)) return;

    const targetUser = message.messageText.split(' ')[1]?.replace(/^@/, '') || message.senderUsername;
    const userVipList = await getVipList(targetUser);

    if (userVipList.totalVips === null) {
        client.log.logAndReply(message, `Esse usuário não existe`);
        return;
    }

    if (userVipList.totalVips === 0) {
        client.log.logAndReply(message, `O usuário ${targetUser} não é moderador em nenhum canal`);
        return;
    }

    client.log.logAndReply(message, `${targetUser} é VIP em ${userVipList.totalVips} canais | ${userVipList.totalPartners} Parceiros | ${userVipList.totalAffiliates} Afiliados | ${userVipList.totalFollowers} Seguidores no total - https://roles.tv/u/${targetUser.toLowerCase()}`);

};

vipListCommand.commandName = 'viplist';
vipListCommand.aliases = ['viplist', 'vl'];
vipListCommand.shortDescription = 'Mostra a lista de canais que algum usuário é vip';
vipListCommand.cooldown = 5000;
vipListCommand.whisperable = false;
vipListCommand.description = `Exibe uma lista de canais onde o usuário fornecido é vip, quantos desses canais são parceiros, afiliados e a soma total de seguidores de todos os canais
• Exemplo: !viplist - Exibe a lista de canais que o usuário que executou o comando é moderador
• Exemplo: !viplist {usuário} - Exibe a lista de canais que o usuário fornecido é moderador`;
vipListCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/${vipListCommand.commandName}/${vipListCommand.commandName}.js`;

module.exports = {
    vipListCommand,
};
