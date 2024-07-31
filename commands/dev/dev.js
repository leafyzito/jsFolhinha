const { logAndReply } = require('../../utils/log.js');

const botSayCommand = async (client, message) => {
    message.command = 'botsay';

    const authorId = message.senderUserID;
    if (authorId !== '120209265') { return; }

    const args = message.messageText.split(' ');
    const targetChannel = args[1];
    const msgContent = args.slice(2).join(' ');

    if (targetChannel == 'all') {
        for (const channel of client.joinedChannels) {
            client.say(channel, msgContent);
        }
        logAndReply(client, message, `foi`);
        return;
    }

    client.say(targetChannel, msgContent);
    logAndReply(client, message, `foi`);
    return;
};

const forceJoinCommand = async (client, message) => {
    message.command = 'forcejoin';

    const authorId = message.senderUserID;
    if (authorId !== '120209265') { return; }

    const args = message.messageText.split(' ');
    const targetChannel = args[1];
    
    client.join(targetChannel)
        .then(() => {
            logAndReply(client, message, `Joined ${targetChannel}`);
        })
        .catch((err) => {
            logAndReply(client, message, `Erro ao dar join em ${targetChannel}: ${err}`);
        });
};

const execCommand = async (client, message) => {
    message.command = 'exec';

    const authorId = message.senderUserID;
    if (authorId !== '120209265') { return; }

    const args = message.messageText.split(' ');
    const command = args.slice(1).join(' ');

    try {
        const res = eval(command);
        console.log(res);
        logAndReply(client, message, `🤖 ${res}`);
    } catch (err) {
        client.say(message.channelName, message.messageID, `🤖 Erro ao executar comando: ${err}`);
    }
};

const getUserIdCommand = async (client, message) => {
    message.command = 'getuserid';

    const authorId = message.senderUserID;
    if (authorId !== '120209265') { return; }

    const args = message.messageText.split(' ');
    const targetUser = args[1];

    if (targetUser == 'id') {
        const targetID = args[2];
        const targetUsername = await client.getUserByUserID(targetID);
        logAndReply(client, message, `Username de ${targetID}: ${targetUsername}`);
        return;
    }

    const targetUserId = await client.getUserID(targetUser);
    logAndReply(client, message, `UserID de ${targetUser}: ${targetUserId}`);
    return;
}


module.exports = {
    botSayCommand: botSayCommand,
    forceJoinCommand: forceJoinCommand,
    execCommand: execCommand,
    getUserIdCommand: getUserIdCommand
};
