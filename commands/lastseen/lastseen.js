const { processCommand } = require("../../utils/processCommand.js");
const { timeSince } = require("../../utils/utils.js");

const lastSeenCommand = async (client, message) => {
    message.command = 'lastseen';
    if (!await processCommand(5000, 'channel', message, client)) return;

    if (message.messageText.split(' ').length === 1) {
        client.log.logAndReply(message, `Use o formato: ${message.commandPrefix}lastseen <usuário>`);
        return;
    }

    const targetUser = message.messageText.split(' ')[1].toLowerCase().replace(/^@/, '')
    
    if (targetUser === message.senderUsername) {
        client.log.logAndReply(message, `Você tá aqui mesmo Stare`);
        return;
    }

    if (['folhinha', 'folhinhabot'].includes(targetUser)) {
        client.log.logAndReply(message, `Eu tô aqui Stare`);
        return;
    }

    const targetUserId = await client.getUserID(targetUser);
    if (!targetUserId) {
        client.log.logAndReply(message, `Esse usuário não existe`);
        return;
    }

    const userInfo = await client.db.get('users', { userid: targetUserId });
    if (userInfo.length === 0) {
        client.log.logAndReply(message, `Nunca vi esse usuário`);
        return;
    }

    if (userInfo[0].optoutLs) {
        client.log.logAndReply(message, `Esse usuário optou por não ser alvo de comandos lastseen 🚫`);
        return;
    }

    const lsDate = userInfo[0].lsDate;
    const timeSinceLs = timeSince(lsDate);

    client.log.logAndReply(message, `${targetUser} foi visto pela última vez num chat há ${timeSinceLs}`);
};

lastSeenCommand.aliases = ['lastseen', 'ls'];

module.exports = {
    lastSeenCommand,
};
