const { processCommand } = require("../../utils/processCommand.js");
const { manageLongResponse } = require("../../utils/utils.js");

async function getAllNicks(userId) {
    const api_url = `https://logs.spanix.team/namehistory/${userId}`;
    const response = await fetch(api_url);
    const data = await response.json();

    // Sort the data by first_timestamp in ascending order
    const sortedData = data.sort((a, b) =>
        new Date(a.first_timestamp) - new Date(b.first_timestamp)
    );

    const nicks = sortedData.map(nick => nick.user_login);
    return nicks;
}

const nicksCommand = async (client, message) => {
    message.command = 'nick';
    if (!await processCommand(5000, 'channel', message, client)) return;

    const nicksTarget = message.messageText.split(' ').slice(1).find(arg => !arg.startsWith('-'))?.replace(/^@/, '').toLowerCase() || message.senderUsername;
    let targetId = null;

    // to allow searching for old nicks
    const userDbInfo = await client.db.get('users', { aliases: nicksTarget });
    if (userDbInfo.length > 0) {
        targetId = userDbInfo[0].userid;
    } else {
        targetId = await client.getUserID(nicksTarget);
    }

    if (!targetId) {
        client.log.logAndReply(message, `Esse usuário não existe`);
        return;
    }

    const aliases = (await getAllNicks(targetId)).join(' → ');

    let response = `${nicksTarget === message.senderUsername ? `O seu histórico de nicks é:` : `O histórico de nicks de ${nicksTarget} (id: ${targetId}) é:`} ${aliases}`
    if (response.length > 490) {
        response = await manageLongResponse(response);
    }
    client.log.logAndReply(message, response);

};

nicksCommand.commandName = 'nick';
nicksCommand.aliases = ['nick', 'nicks', 'nicknames', 'namehistory', 'nickhistory'];
nicksCommand.shortDescription = 'Mostra o histórico de nicks de algum usuário';
nicksCommand.cooldown = 5000;
nicksCommand.whisperable = true;
nicksCommand.description = `Exibe o histórico de nicks de um usuário ou de quem executou o comando caso nenhum usuário seja fornecido
• Exemplo: !nicks @leafyzito - O bot irá responder com o histórico de nicks de leafyzito`;
// É também possível obter todo (ou quase todo) o histórico de nicks de um usuário usando o argumento -all ou -todos. Note que esta versão do comando pode ser um pouco lenta
// • Exemplo: !nicks @leafyzito -all - O bot irá responder com o histórico de nicks de leafyzito, consoante a API usada
nicksCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/${nicksCommand.commandName}/${nicksCommand.commandName}.js`;

module.exports = {
    nicksCommand,
};
