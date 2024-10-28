const { processCommand } = require("../../utils/processCommand.js");

async function getModList(user) {
    const api_url = `https://roles.tv/api/user/login/${user}`;
    const response = await fetch(api_url);
    const data = await response.json();

    if (data.statusCode === 404) {
        return null;
    }

    const totalMods = data.data.roles.mods.total;
    let totalPartners = 0;
    let totalAffiliates = 0;
    let totalFollowers = 0;

    data.data.roles.mods.list.forEach((item) => {
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

    return { totalPartners, totalMods, totalAffiliates, totalFollowers: totalFollowers.toLocaleString('en-US') };
}

const modListCommand = async (client, message) => {
    message.command = 'modlist';
    if (!await processCommand(5000, 'channel', message, client)) return;

    const targetUser = message.messageText.split(' ')[1]?.replace(/^@/, '') || message.senderUsername;
    const userModList = await getModList(targetUser);

    if (userModList.totalMods === null) {
        client.log.logAndReply(message, `Esse usuário não existe`);
        return;
    }

    if (userModList.totalMods === 0) {
        client.log.logAndReply(message, `O usuário ${targetUser} não é moderador em nenhum canal`);
        return;
    }

    client.log.logAndReply(message, `${targetUser} é moderador em ${userModList.totalMods} canais | ${userModList.totalPartners} Parceiros | ${userModList.totalAffiliates} Afiliados | ${userModList.totalFollowers} Seguidores no total - https://roles.tv/u/${targetUser.toLowerCase()}`);

};

modListCommand.commandName = 'modlist';
modListCommand.aliases = ['modlist', 'modslist', 'ml'];
modListCommand.shortDescription = 'Mostra a lista de canais que algum usuário modera';
modListCommand.cooldown = 5000;
modListCommand.whisperable = false;
modListCommand.description = `Exibe uma lista de canais onde o usuário fornecido é moderador, quantos desses canais são parceiros, afiliados e a soma total de seguidores de todos os canais
• Exemplo: !modlist - Exibe a lista de canais que o usuário que executou o comando é moderador
• Exemplo: !modlist {usuário} - Exibe a lista de canais que o usuário fornecido é moderador`;
modListCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/${modListCommand.commandName}/${modListCommand.commandName}.js`;

module.exports = {
    modListCommand,
};
