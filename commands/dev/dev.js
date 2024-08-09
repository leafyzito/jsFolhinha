const { exec } = require('child_process');

const botSayCommand = async (client, message) => {
    message.command = 'dev botsay';

    const authorId = message.senderUserID;
    if (authorId !== process.env.DEV_USERID) { return; }

    const args = message.messageText.split(' ');
    const targetChannel = args[1];
    const msgContent = args.slice(2).join(' ');

    if (targetChannel == 'all') {
        for (const channel of client.joinedChannels) {
            setTimeout(() => {
                client.log.send(channel, msgContent);
            }, 1500);
        }
        client.log.logAndReply(message, `foi`);
        return;
    }

    client.log.send(targetChannel, msgContent);
    client.log.logAndReply(message, `foi`);
    return;
};

const forceJoinCommand = async (client, message) => {
    message.command = 'dev forcejoin';

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
    message.command = 'dev forcepart';

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
    message.command = 'dev exec';

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
    message.command = 'dev getuserid';

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
    message.command = 'dev restart';

    const authorId = message.senderUserID;
    if (authorId !== process.env.DEV_USERID) { return; }

    client.log.logAndReply(message, `Reiniciando...`);

    exec('pm2 restart folhinhajs');
}

const resetPet = async (client, message) => {
    message.command = 'dev resetpet';

    const authorId = message.senderUserID;
    if (authorId !== process.env.DEV_USERID) { return; }

    const currentTime = Math.floor(Date.now() / 1000);
    await client.db.updateMany('pet', {}, { $set: { last_interaction: currentTime } });

    client.log.logAndReply(message, `feito 👍`);
}

const resetCdCommand = async (client, message) => {
    message.command = 'dev resetcd';

    const authorId = message.senderUserID;
    if (authorId !== process.env.DEV_USERID) { return; }

    await client.db.updateMany('cookie', {}, {
        $set: {
            claimedToday: false,
            giftedToday: false,
            usedSlot: false
        }
    });

    client.log.logAndReply(message, `cookies resetados 👍`);
}

const reloadCommand = async (client, message) => {
    message.command = 'dev reload';

    const authorId = message.senderUserID;
    if (authorId !== process.env.DEV_USERID) { return; }

    // Pull changes from Git
    exec('git pull', (err, stdout, stderr) => {
        if (err) {
            console.log(`* Erro ao puxar mudanças do Git: ${err}`);
            client.log.logAndReply(message, `Deu não, check logs`);
            return;
        }

        console.log(`* Mudanças puxadas do Git: ${stdout}`);

        // Clear require cache for all command files
        Object.keys(require.cache).forEach((key) => {
            if (key.includes('\\commands\\') || key.includes('/commands/')) {
                console.log(`deleting ${key}`);
                delete require.cache[key];
            }
        });

        // Reload the commands
        client.loadCommands();

        client.log.logAndReply(message, `Comandos recarregados, supostamente 👍`);
    });
};

botSayCommand.aliases = ['botsay', 'bsay'];
forceJoinCommand.aliases = ['forcejoin', 'fjoin'];
forcePartCommand.aliases = ['forcepart', 'fpart'];
execCommand.aliases = ['exec', 'eval'];
getUserIdCommand.aliases = ['getuserid', 'uid'];
restartCommand.aliases = ['restart'];
resetPet.aliases = ['resetpet', 'resetpat'];
resetCdCommand.aliases = ['resetcd'];
reloadCommand.aliases = ['reload'];

module.exports = {
    botSayCommand,
    forceJoinCommand,
    forcePartCommand,
    execCommand,
    getUserIdCommand,
    restartCommand,
    resetPet,
    resetCdCommand,
    reloadCommand
};
