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
        client.log.logAndReply(message, `foi`);
        return;
    }

    client.say(targetChannel, msgContent);
    client.log.logAndReply(message, `foi`);
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
            client.log.logAndReply(message, `Joined ${targetChannel}`);
        })
        .catch((err) => {
            client.log.logAndReply(message, `Erro ao dar join em ${targetChannel}: ${err}`);
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
        client.log.logAndReply(message, `🤖 ${res}`);
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
        client.log.logAndReply(message, `Username de ${targetID}: ${targetUsername}`);
        return;
    }

    const targetUserId = await client.getUserID(targetUser);
    client.log.logAndReply(message, `UserID de ${targetUser}: ${targetUserId}`);
    return;
}


module.exports = {
    botSayCommand: botSayCommand,
    botSayAliases: ['botsay', 'bsay'],
    forceJoinCommand: forceJoinCommand,
    forceJoinAliases: ['forcejoin', 'fjoin'],
    execCommand: execCommand,
    execAliases: ['exec', 'eval'],
    getUserIdCommand: getUserIdCommand,
    getUserIdAliases: ['getuserid', 'uid']
};
