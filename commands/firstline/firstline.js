const { processCommand } = require("../../utils/processCommand.js");
const { timeSince } = require("../../utils/utils.js");

async function getFirstLineDate(channelid, usernameid) {
    const apiUrl = `https://logs.zonian.dev/list?channelid=${channelid}&userid=${usernameid}`;

    const response = await fetch(apiUrl, {
        method: 'GET',
    });

    if (!response.ok) {
        // console.log('Error fetching logs:', response.statusText);
        return null;
    }

    const data = await response.json();

    const availableLogsLen = data.availableLogs.length;
    const firstAvailableLog = data.availableLogs[availableLogsLen - 1];

    const logUrl = `https://logs.zonian.dev/channelid/${channelid}/userid/${usernameid}/${firstAvailableLog.year}/${firstAvailableLog.month}`;

    return logUrl;
}

async function getFirstLineMessage(logUrl) {
    const response = await fetch(logUrl, {
        method: 'GET',
    });

    if (!response.ok) {
        // console.log('Error fetching logs:', response.statusText);
        return null;
    }

    const data = await response.text();
    const firstLine = data.split('\n')[0];

    const regex = /\[(.*?)\] #(.*?) (.*?): (.*)/;
    const [_, timestamp, channelName, user, message] = firstLine.match(regex);
    return {
        date: timestamp,
        channel: channelName,
        user: user,
        message: message
    };
}

async function getFirstLine(channelid, userid) {
    const firstLogUrl = await getFirstLineDate(channelid, userid);
    if (!firstLogUrl) {
        return null;
    }
    const firstLineMessage = await getFirstLineMessage(firstLogUrl);
    return firstLineMessage;
}

const firstLineCommand = async (client, message) => {
    message.command = 'firstline';
    if (!await processCommand(5000, 'channel', message, client)) return;

    let targetUser = message.messageText.split(' ')[1]?.replace(/^@/, '') || message.senderUsername;
    const targetId = targetUser !== message.senderUsername.toLowerCase() ? await client.getUserID(targetUser.toLowerCase()) : message.senderUserID;


    const firstLine = await getFirstLine(message.channelID, targetId);
    if (!firstLine) {
        client.log.logAndReply(message, `Nunca loguei uma mensagem desse usuário neste chat (contando desde 06/03/2025)`);
        return;
    }

    client.log.logAndReply(message, `${targetUser === message.senderUsername.toLowerCase() ? 'A sua primeira' : `A primeira mensagem de ${firstLine.user}`} neste chat foi em ${firstLine.date}: ${firstLine.message}`);
    return;
};

firstLineCommand.commandName = 'firstline';
firstLineCommand.aliases = ['firstline', 'fl'];
firstLineCommand.shortDescription = 'Veja a primeira mensagem de um usuário';
firstLineCommand.cooldown = 5000;
firstLineCommand.whisperable = false;
firstLineCommand.description = `Receba a primeira mensagem de um usuário fornecido ou, caso nenhum seja fornecido, da pessoa que executou o comando
• Exemplo: !firstline - O bot vai mostrar a primeira mensagem de quem executou o comando no chat onde o comando foi executado
• Exemplo: !firstline @leafyzito - O bot vai mostrar a primeira mensagem de @leafyzito no chat onde o comando foi executado`;
firstLineCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/${firstLineCommand.commandName}/${firstLineCommand.commandName}.js`;

module.exports = {
    firstLineCommand,
};
