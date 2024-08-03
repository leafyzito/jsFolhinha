const { processCommand } = require("../../utils/processCommand.js");
const { timeSince } = require("../../utils/utils.js");

const stalkCommand = async (client, message) => {
    message.command = 'stalk';
    if (!await processCommand(5000, 'channel', message, client)) return;

    if (message.messageText.split(' ').length === 1) {
        client.log.logAndReply(message, `Use o formato: ${message.commandPrefix}stalk <usuário>`);
        return;
    }

    const targetUser = message.messageText.split(' ')[1].toLowerCase().replace(/^@/, '')
    
    if (targetUser === message.senderUsername) {
        client.log.logAndReply(message, `Você tá aqui mesmo Stare`);
        return;
    }

    if (['folhinha', 'folhinhabot'].includes(targetUser)) {
        client.log.logAndReply(message, `Tá tentando me stalkear pra quê Stare`);
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

    if (userInfo[0].optoutStalk) {
        client.log.logAndReply(message, `Esse usuário optou por não ser alvo de comandos stalk 🚫`);
        return;
    }

    var lsChannel = userInfo[0].lsChannel;
    const lsChannelId = await client.getUserID(lsChannel);
    const lsChannelInfo = await client.db.get('users', { userid: lsChannelId });
    if (lsChannelInfo.length !== 0 && lsChannelInfo[0].optoutOwnChannel) {
        lsChannel = '***';
    }

    const lsDate = userInfo[0].lsDate;
    const lsMessage = userInfo[0].lsMessage;
    const timeSinceLs = timeSince(lsDate);

    client.log.logAndReply(message, `${targetUser} foi visto pela última vez há ${timeSinceLs} no #${lsChannel} - ${lsMessage}`);
};


module.exports = {
    stalkCommand,
    stalkAliases: ['stalk']
};
