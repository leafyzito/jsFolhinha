const { Message } = require("discord.js");
const { processCommand } = require("../../utils/processCommand.js");
const { timeSinceDT } = require("../../utils/utils.js");

async function getRandomLine(client, userid, channelid) {
    const res = await client.turso.client.execute({ sql: `SELECT * FROM messagelog WHERE userid = :userid AND channelid = :channelid ORDER BY RANDOM() LIMIT 1`, args: { userid: userid, channelid: channelid } });
    return res.rows[0];
}

const randomLineCommand = async (client, message) => {
    message.command = 'randomline';
    if (!await processCommand(5000, 'channel', message, client)) return;

    const targetUser = message.messageText.split(' ')[1]?.replace(/^@/, '') || message.senderUsername;
    const targetId = targetUser.toLowerCase() === message.senderUsername ? message.senderUserID : await client.getUserID(targetUser);
    if (!targetId) {
        client.log.logAndReply(message, `Esse usuário não existe`);
        return;
    }

    const randomLine = await getRandomLine(client, targetId, message.channelID);
    if (!randomLine) {
        client.log.logAndReply(message, `Nunca loguei uma mensagem desse usuário neste chat (contando desde 19/10/2024)`);
        return;
    }

    client.log.logAndReply(message, `(há ${timeSinceDT(randomLine.date)[0]}) ${randomLine.user}: ${randomLine.content}`);
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
