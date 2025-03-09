const { processCommand } = require("../../utils/processCommand.js");
const { timeSince } = require("../../utils/utils.js");

async function getFirstLine(userid, channelid) {
    const url = `http://localhost:8025/channelid/${channelid}/userid/${userid}/firstMsg`
    const headers = { accept: 'application/json' }
    const response = await fetch(url, { headers })
    // console.log(data)
    if (response.status !== 200) {
        return null;
    }
    const data = await response.text()
    // console.log(data)
    // Get only the first line from the multi-line response
    const firstLine = data.split('\n')[0];
    // Parse the log line into components
    const regex = /\[(.*?)\] #(.*?) (.*?): (.*)/;
    const [_, timestamp, channelName, user, message] = firstLine.match(regex);

    return {
        channel: channelName,
        user: user,
        message: message,
        date: timestamp
    }
}

const firstLineCommand = async (client, message) => {
    message.command = 'firstline';
    if (!await processCommand(5000, 'channel', message, client)) return;

    let targetUser = message.messageText.split(' ')[1]?.replace(/^@/, '') || message.senderUsername;
    const targetId = targetUser !== message.senderUsername.toLowerCase() ? await client.getUserID(targetUser.toLowerCase()) : message.senderUserID;


    const firstLine = await getFirstLine(targetId, message.channelID);
    if (!firstLine) {
        client.log.logAndReply(message, `Nunca loguei uma mensagem desse usuário neste chat (contando desde 06/03/2025)`);
        return;
    }

    client.log.logAndReply(message, `${targetUser === message.senderUsername.toLowerCase() ? 'A sua primeira' : `A primeira mensagem de ${firstLine.user}`} neste chat foi em (${firstLine.date}): ${firstLine.message}`);
    return;
};

firstLineCommand.commandName = 'firstline';
firstLineCommand.aliases = ['firstline', 'fl'];
firstLineCommand.shortDescription = 'Veja a primeira mensagem de um usuário';
firstLineCommand.cooldown = 5000;
firstLineCommand.whisperable = false;
firstLineCommand.description = `Receba a primeira mensagem de um usuário fornecido ou, caso nenhum seja fornecido, da pessoa que executou o comando
• Exemplo: !firstline - O bot vai mostrar a primeira mensagem de quem executou o comando no chat onde o comando foi executado
• Exemplo: !firstline @leafyzito - O bot vai mostrar a primeira mensagem de @leafyzito no chat onde o comando foi executado

Começou a contar desde 06/03/2025`;
firstLineCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/${firstLineCommand.commandName}/${firstLineCommand.commandName}.js`;

module.exports = {
    firstLineCommand,
};
