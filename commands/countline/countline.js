const { processCommand } = require("../../utils/processCommand.js");

const countlineCommand = async (client, message) => {
    message.command = 'countline';
    if (!await processCommand(5000, 'channel', message, client)) return;

    const clTarget = message.messageText.split(' ')[1]?.replace(/^@/, '') || message.senderUsername;

    if (clTarget.toLowerCase() === 'folhinhabot') {
        client.log.logAndReply(message, `Para de tentar me contar Stare`);
        return;
    }

    if (clTarget.toLowerCase() === 'top') {
        const clCurrChat = await client.db.get('users', { [`msgCount.${message.channelName}`]: { "$exists": true } });
        clCurrChat.sort((a, b) => b.msgCount[message.channelName] - a.msgCount[message.channelName]);

        // only top 5
        const top5 = clCurrChat.slice(0, 5);
        let reply = `Top 5 chatters desse chat: `;
        for (let i = 0; i < top5.length; i++) {
            const user = top5[i];
            const username = top5[i].currAlias;
            reply += `${i + 1}º ${username}: (${user.msgCount[message.channelName]})`;
            if (i !== top5.length - 1) {
                reply += ', ';
            }
        }

        let userPlacing;
        let userIndex;
        for (let i = 0; i < top5.length; i++) {
            if (top5[i].userid === message.senderUserID) {
                userPlacing = i + 1;
                userIndex = i;
                break;
            }
        }

        if (!userPlacing) {
            reply += `. Você está em ${clCurrChat.findIndex(user => user.userid === message.senderUserID) + 1}º com ${clCurrChat.find(user => user.userid === message.senderUserID).msgCount[message.channelName]} mensagens`;
        }

        client.log.logAndReply(message, `${reply}`);
        return;
    }

    if (clTarget.toLowerCase() === 'folhinhabot') {
        client.log.logAndReply(message, `Para de tentar me contar Stare`);
        return;
    }

    const clTargetID = (clTarget !== message.senderUserID) ? await client.getUserID(clTarget) : message.senderUserID;
    if (!clTargetID) {
        client.log.logAndReply(message, `O usuário ${clTarget} não existe`);
        return;
    }

    const clCount = await client.db.get('users', { userid: clTargetID });
    if (clCount.length === 0) {
        client.log.logAndReply(message, `Nunca vi esse usuário`);
        return;
    }

    const msgCount = clCount[0].msgCount;
    let userMsgCount = 0;
    for (const channel in msgCount) {
        if (channel === message.channelName) {
            userMsgCount = msgCount[channel];
            break;
        }
    }

    if (userMsgCount === 0) {
        client.log.logAndReply(message, `${clTarget} nunca falou neste chat`);
        return;
    }

    client.log.logAndReply(message, `${clTarget} mandou um total de ${userMsgCount} mensagens neste chat`);
};


module.exports = {
    countlineCommand: countlineCommand,
    countlineAliases: ['countline', 'cl']
};
