const { exec } = require('child_process');

const botSayCommand = async (client, message) => {
    message.command = 'botsay';

    const authorId = message.senderUserID;
    if (authorId !== process.env.DEV_USERID) { return; }

    const args = message.messageText.split(' ');
    const targetChannel = args[1];
    const msgContent = args.slice(2).join(' ');

    if (targetChannel == 'all') {
        for (const channel of client.joinedChannels) {
            client.log.send(channel, msgContent);
        }
        client.log.logAndReply(message, `foi`);
        return;
    }

    client.log.send(targetChannel, msgContent);
    client.log.logAndReply(message, `foi`);
    return;
};

const forceJoinCommand = async (client, message) => {
    message.command = 'forcejoin';

    const authorId = message.senderUserID;
    if (authorId !== process.env.DEV_USERID) { return; }

    const args = message.messageText.split(' ');
    const targetChannel = args[1].toLowerCase();
    const announce = args[2] === 'true' ? true : false;

    client.join(targetChannel)
        .then(() => {
            client.log.logAndReply(message, `Joined ${targetChannel}`);
            if (announce) {
                client.log.send(targetChannel, `👀`);
            }
        })
        .catch((err) => {
            client.log.logAndReply(message, `Não foi, check logs`);
            console.log(err);
        });
};

const forcePartCommand = async (client, message) => {
    message.command = 'forcepart';

    const authorId = message.senderUserID;
    if (authorId !== process.env.DEV_USERID) { return; }

    const args = message.messageText.split(' ');
    const targetChannel = args[1];
    const announce = args[2] === 'announce' ? true : false;

    client.part(targetChannel)
        .then(() => {
            client.log.logAndReply(message, `Parted ${targetChannel}`);
            if (announce) {
                client.log.send(targetChannel, `👋`);
            }
        })
        .catch((err) => {
            client.log.logAndReply(message, `Erro ao dar part em ${targetChannel}: ${err}`);
        });
}

const execCommand = async (client, message) => {
    message.command = 'exec';

    const authorId = message.senderUserID;
    if (authorId !== process.env.DEV_USERID) { return; }

    const args = message.messageText.split(' ');
    const command = args.slice(1).join(' ');

    try {
        if (command.includes('await')) {
            const res = await eval(command);
            console.log(res);
            client.log.logAndReply(message, `🤖 ${res}`);
            return;
        }

        const res = eval(command);
        console.log(res);
        client.log.logAndReply(message, `🤖 ${res}`)
        return;
        
    } catch (err) {
        client.log.send(message.channelName, message.messageID, `🤖 Erro ao executar comando: ${err}`);
    }
};

const getUserIdCommand = async (client, message) => {
    message.command = 'getuserid';

    const authorId = message.senderUserID;
    if (authorId !== process.env.DEV_USERID) { return; }

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

const restartCommand = async (client, message) => {
    message.command = 'restart';

    const authorId = message.senderUserID;
    if (authorId !== process.env.DEV_USERID) { return; }

    client.log.logAndReply(message, `Reiniciando...`);

    exec('node restart.js');
}

const resetPet = async (client, message) => {
    message.command = 'resetpet';

    const authorId = message.senderUserID;
    if (authorId !== process.env.DEV_USERID) { return; }

    const currentTime = Math.floor(Date.now() / 1000);
    await client.db.updateMany('pet', {}, { $set: { last_interaction: currentTime } });

    client.log.logAndReply(message, `feito 👍`);
}

botSayCommand.aliases = ['botsay', 'bsay'];
forceJoinCommand.aliases = ['forcejoin', 'fjoin'];
forcePartCommand.aliases = ['forcepart', 'fpart'];
execCommand.aliases = ['exec', 'eval'];
getUserIdCommand.aliases = ['getuserid', 'uid'];
restartCommand.aliases = ['restart'];
resetPet.aliases = ['resetpet', 'resetpat'];

module.exports = {
    botSayCommand,
    forceJoinCommand,
    forcePartCommand,
    execCommand,
    getUserIdCommand,
    restartCommand,
    resetPet
};
