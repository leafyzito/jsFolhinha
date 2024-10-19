const { processCommand } = require("../../utils/processCommand.js");

function getFormattedTimeSince(date) {
    const currentDate = new Date();
    const seconds = Math.floor((currentDate - date) / 1000);

    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((seconds % (60 * 60)) / 60);
    const secondsLeft = seconds % 60;

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m ${secondsLeft}s`;
    if (minutes > 0) return `${minutes}m ${secondsLeft}s`;
    return `${secondsLeft}s`;
}

async function getRandomLine(client, userid, channelid) {
    if (!userid) {
        const res = await client.turso.client.execute({ sql: `SELECT * FROM messagelog WHERE channelid = :channelid ORDER BY RANDOM() LIMIT 1`, args: { channelid: channelid } });
        return res.rows[0];
    }

    const res = await client.turso.client.execute({ sql: `SELECT * FROM messagelog WHERE userid = :userid AND channelid = :channelid ORDER BY RANDOM() LIMIT 1`, args: { userid: userid, channelid: channelid } });
    return res.rows[0];
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

    const randomLine = await getRandomLine(client, targetId, message.channelID);
    if (!targetId && !randomLine) {
        client.log.logAndReply(message, `Nunca loguei uma mensagem desse usuário neste chat (contando desde 19/10/2024)`);
        return;
    }
    if (!randomLine) { // this should never happen
        client.log.logAndReply(message, `Nunca loguei uma mensagem neste chat (contando desde 19/10/2024)`);
        return;
    }

    client.log.logAndReply(message, `(há ${getFormattedTimeSince(randomLine.date)}) ${randomLine.user}: ${randomLine.content}`);
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

Começou a contar desde 19/10/2024`;
randomLineCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/${randomLineCommand.commandName}/${randomLineCommand.commandName}.js`;

module.exports = {
    randomLineCommand,
};
