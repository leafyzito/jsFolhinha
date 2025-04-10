const { processCommand } = require("../../utils/processCommand.js");
const { manageLongResponse } = require("../../utils/utils.js");

async function getAllNicks(userId) {
    const api_url = `https://logs.spanix.team/namehistory/${userId}`;
    const response = await fetch(api_url);
    const data = await response.json();

    const nicks = data.map(nick => nick.user_login);
    return nicks;
}

const nicksCommand = async (client, message) => {
    message.command = 'nick';
    if (!await processCommand(5000, 'channel', message, client)) return;

    const nicksTarget = message.messageText.split(' ').slice(1).find(arg => !arg.startsWith('-'))?.replace(/^@/, '').toLowerCase() || message.senderUsername;
    const targetId = nicksTarget === message.senderUsername ? message.senderID : await client.getUserID(nicksTarget);
    const allNicks = await getAllNicks(targetId);
    const aliases = allNicks.join(' → ');

    // if any of the message args is "-all" or "-todos", get all nicks
    // if (message.messageText.includes('-all') || message.messageText.includes('-todos')) {
    //     console.log(nicksTarget);
    //     const targetId = await client.getUserID(nicksTarget);
    //     if (!targetId) {
    //         client.log.logAndReply(message, `Esse usuário não existe`);
    //         return;
    //     }
    //     const allNicks = await getAllNicks(targetId);
    //     const aliases = allNicks.join(' → ');
    //     client.log.logAndReply(message, `O histórico de nicks de ${nicksTarget} (id: ${targetId}) é: ${aliases}`);
    //     return;
    // }

    // if (userAliases.length === 0) {
    //     client.log.logAndReply(message, `Nunca vi esse usuário`);
    //     return;
    // }

    // const aliases = userAliases[0].aliases.join(' → ');
    // const idFromDb = userAliases[0].userid;

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
