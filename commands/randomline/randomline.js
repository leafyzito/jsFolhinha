const { processCommand } = require("../../utils/processCommand.js");
const { timeSince } = require("../../utils/utils.js");

async function getRandomLine(userid, channelid) {
    let response;
    if (!userid) {
        const url = `http://localhost:8025/channelid/${channelid}/random`
        const headers = { accept: 'application/json' }
        response = await fetch(url, { headers })
        // console.log(data)
    } else {
        const url = `http://localhost:8025/channelid/${channelid}/userid/${userid}/random`
        const headers = { accept: 'application/json' }
        response = await fetch(url, { headers })
        // console.log(data)
    }
    if (response.status !== 200) {
        return null;
    }
    const data = await response.text()
    // Parse the log line into components
    const regex = /\[(.*?)\] #(.*?) (.*?): (.*)/;
    const [_, timestamp, channelName, user, message] = data.match(regex);

    // Convert timestamp to Unix time (assuming timestamp is in format "YYYY-MM-DD HH:mm:ss")
    const unixTimestamp = Math.floor(new Date(timestamp).getTime() / 1000);

    return {
        channel: channelName,
        user: user,
        message: message,
        timeSince: timeSince(unixTimestamp)
    }
}

const randomLineCommand = async (client, message) => {
    message.command = 'randomline';
    if (!await processCommand(5000, 'channel', message, client)) return;

    const targetUser = message.messageText.split(' ')[1]?.replace(/^@/, '') || null;
    const targetId = targetUser ? await client.getUserID(targetUser) : null;
    // if (!targetId) {
    //     client.log.logAndReply(message, `Esse usuário não existe`);
    //     return;
    // }

    const randomLine = await getRandomLine(targetId, message.channelID);
    if (!targetId && !randomLine) {
        client.log.logAndReply(message, `Nunca loguei uma mensagem desse usuário neste chat (contando desde 06/03/2025)`);
        return;
    }
    if (!randomLine) { // this should never happen
        client.log.logAndReply(message, `Nunca loguei uma mensagem desse usuário neste chat (contando desde 06/03/2025)`);
        return;
    }

    client.log.logAndReply(message, `(há ${randomLine.timeSince}) ${randomLine.user}: ${randomLine.message}`);
    return;
};

randomLineCommand.commandName = 'randomline';
randomLineCommand.aliases = ['randomline', 'rl', 'randomquote', 'rq'];
randomLineCommand.shortDescription = 'Veja uma mensagem aleatória de algum usuário';
randomLineCommand.cooldown = 5000;
randomLineCommand.whisperable = false;
randomLineCommand.description = `Receba uma mensagem aleatória de um usuário fornecido ou, caso nenhum seja fornecido, da pessoa que executou o comando
• Exemplo: !randomline - O bot vai mostrar uma mensagem aleatória de quem executou o comando no chat onde o comando foi executado
• Exemplo: !randomline @leafyzito - O bot vai mostrar uma mensagem aleatória de @leafyzito no chat onde o comando foi executado

Começou a contar desde 06/03/2025`;
randomLineCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/${randomLineCommand.commandName}/${randomLineCommand.commandName}.js`;

module.exports = {
    randomLineCommand,
};
