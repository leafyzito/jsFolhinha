const { exec } = require('child_process');
const { shortenUrl, manageLongResponse } = require('../../utils/utils.js');


async function createNewChannelConfig(client, user) {
    const newConfig = {
        channel: user,
        channelId: await client.getUserID(user),
        prefix: '!',
        offlineOnly: false,
        isPaused: false,
        disabledCommands: [],
        devBanCommands: []
    };

    await client.db.insert('config', newConfig);
    await client.reloadChannelConfigs();
    await client.reloadChannelPrefixes();

    return;
}

const botSayCommand = async (client, message) => {
    message.command = 'dev botsay';

    const authorId = message.senderUserID;
    if (authorId !== process.env.DEV_USERID) { return; }

    const args = message.messageText.split(' ');
    const targetChannel = args[1];
    const msgContent = args.slice(2).join(' ');

    if (targetChannel == 'all') {
        for (let i = 0; i < [...client.joinedChannels].length; i++) {
            const channel = [...client.joinedChannels][i];
            await new Promise(resolve => setTimeout(resolve, 2_500)); // 2.5 second interval between each message
            // console.log(`sending to ${channel}`);
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

            // add channel to channelsToJoin array
            client.channelsToJoin.push(targetChannel);
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

            // remove channel from channelsToJoin array
            client.channelsToJoin = client.channelsToJoin.filter(channel => channel !== targetChannel);
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
        const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;
        const asyncCommand = new AsyncFunction('client', 'message', `return ${command}`);
        let res = await asyncCommand(client, message);
        console.log(res);
        if (typeof res === 'object') {
            res = JSON.stringify(res);
        }
        client.log.logAndReply(message, `🤖 ${res.length > 490 ? await manageLongResponse(res) : res}`);
    } catch (err) {
        client.log.logAndReply(message, `🤖 Erro ao executar comando: ${err}`);
    }
};

const sqlExecCommand = async (client, message) => {
    message.command = 'dev sqlexec';

    const authorId = message.senderUserID;
    if (authorId !== process.env.DEV_USERID) { return; }

    const args = message.messageText.split(' ');
    const command = args.slice(1).join(' ');

    try {
        const query = await client.turso.client.execute(command);
        const res = JSON.stringify(query.rows);
        console.log(res);
        client.log.logAndReply(message, `🤖 ${res.length > 490 ? await manageLongResponse(res, true) : res}`);
    } catch (err) {
        client.log.logAndReply(message, `🤖 Erro ao executar comando: ${err}`);
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

const resetPetCommand = async (client, message) => {
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

        client.discord.log(`* Mudanças puxadas do Git: ${stdout}`);
        console.log(`* Mudanças puxadas do Git: ${stdout}`);

        // Clear require cache for all command files
        Object.keys(require.cache).forEach((key) => {
            if (key.includes('\\commands\\') || key.includes('/commands/')) {
                console.log(`deleting ${key} `);
                delete require.cache[key];
            }
        });

        // Reload the commands
        client.loadCommands();

        client.log.logAndReply(message, `Comandos recarregados 👍`);
    });
};

const reloadDbCommand = async (client, message) => {
    message.command = 'dev reloaddb';

    const authorId = message.senderUserID;
    if (authorId !== process.env.DEV_USERID) { return; }

    await client.db.loadDbCache();
    client.log.logAndReply(message, `Base de dados recarregada 👍`);
}

const gitPullCommand = async (client, message) => {
    message.command = 'dev gitpull';

    const authorId = message.senderUserID;
    if (authorId !== process.env.DEV_USERID) { return; }

    exec('git pull', (err, stdout, stderr) => {
        if (err) {
            console.log(`* Erro ao puxar mudanças do Git: ${err}`);
            client.log.logAndReply(message, `Deu não, check logs`);
            return;
        }

        client.discord.log(`* Mudanças puxadas do Git: ${stdout}`);
        console.log(`* Mudanças puxadas do Git: ${stdout}`);

        const cleanOutput = stdout.replace(/[\n\r]/g, '');
        client.log.logAndReply(message, `Mudanças puxadas do Git: ${cleanOutput}`);
    });
};

const reloadEmotesCommand = async (client, message) => {
    message.command = 'dev reloademotes';

    const authorId = message.senderUserID;
    if (authorId !== process.env.DEV_USERID) { return; }

    const targetChannel = message.messageText.split(' ')[1]?.toLowerCase() || message.channelName;

    if (targetChannel === 'all') {
        const channelsToReload = Object.keys(client.emotes.cachedEmotes);
        for (const channel of channelsToReload) {
            client.emotes.cachedEmotes[channel] = null;
            await client.emotes.getChannelEmotes(channel);
        }

        const emote = await client.emotes.getEmoteFromList(message.channelName, ['joia', 'jumilhao'], '👍');
        client.log.logAndReply(message, `Emotes recarregados em ${channelsToReload.length} canais ${emote} `);
        return;
    }
    client.emotes.cachedEmotes[targetChannel] = null;
    await client.emotes.getChannelEmotes(targetChannel);

    const emote = await client.emotes.getEmoteFromList(message.channelName, ['joia', 'jumilhao'], '👍');
    client.log.logAndReply(message, `Emotes recarregados ${emote} `);
}

const allEmotesCommand = async (client, message) => {
    message.command = 'dev allemotes';

    const authorId = message.senderUserID;
    if (authorId !== process.env.DEV_USERID) { return; }

    const targetChannel = message.messageText.split(' ')[1] || message.channelName;
    const channelEmotes = await client.emotes.getChannelEmotes(targetChannel);
    client.log.logAndReply(message, `${channelEmotes.length} emotes no total`);

    // send all emotes in chunks of 490 characters
    let emoteMessage = "";
    for (let i = 0; i < channelEmotes.length; i++) {
        if ((emoteMessage + ` ${channelEmotes[i]} `).length > 490) {
            client.log.logAndSay(message, emoteMessage);
            emoteMessage = "";
        }
        emoteMessage += ` ${channelEmotes[i]} `;
    }
    if (emoteMessage.length > 0) {
        client.log.logAndSay(message, emoteMessage);
    }
}

const devBanCommand = async (client, message) => {
    message.command = 'dev ban';

    const authorId = message.senderUserID;
    if (authorId !== process.env.DEV_USERID) { return; }

    const targetUser = message.messageText.split(' ')[1];

    if (!targetUser) {
        client.log.logAndReply(message, `Use o formato: ${message.commandPrefix} devban < usuário > <all /comando > `);
        return;
    }

    const targetUserId = await client.getUserID(targetUser);

    if (!targetUserId) {
        client.log.logAndReply(message, `Esse usuário não existe`);
        return;
    }

    const targetCommand = message.messageText.split(' ')[2];

    if (!targetCommand) {
        client.log.logAndReply(message, `Comando não especificado`);
        return;
    }

    const hasBanRecord = await client.db.get('bans', { userId: targetUserId });
    if (hasBanRecord.length === 0) {
        await client.db.insert('bans', { userId: targetUserId, bannedCommands: [] });
    }

    await client.db.update('bans', { userId: targetUserId }, { $push: { bannedCommands: targetCommand } });
    await client.reloadBans();

    client.log.logAndReply(message, `👍`);
    return;
}

const unbanDevCommand = async (client, message) => {
    message.command = 'dev unban';

    const authorId = message.senderUserID;
    if (authorId !== process.env.DEV_USERID) { return; }

    const targetUser = message.messageText.split(' ')[1];
    const targetUserId = await client.getUserID(targetUser);

    if (!targetUserId) {
        client.log.logAndReply(message, `Esse usuário não existe`);
        return;
    }

    const targetCommand = message.messageText.split(' ')[2];

    if (!targetCommand) {
        client.log.logAndReply(message, `Comando não especificado`);
        return;
    }

    const hasBanRecord = await client.db.get('bans', { userId: targetUserId });
    if (hasBanRecord.length === 0) {
        client.log.logAndReply(message, `Esse usuário não tem bans`);
        return;
    }

    await client.db.update('bans', { userId: targetUserId }, { $pull: { bannedCommands: targetCommand } });
    await client.reloadBans();

    client.log.logAndReply(message, `👍`);
    return;
}

const shortenCommand = async (client, message) => {
    message.command = 'dev shorten';

    const authorId = message.senderUserID;
    if (authorId !== process.env.DEV_USERID) { return; }

    const targetUrl = message.messageText.split(' ')[1];
    if (!targetUrl) {
        client.log.logAndReply(message, `Use o formato: ${message.commandPrefix} shorten < url > `);
        return;
    }

    const shortenedUrl = await shortenUrl(targetUrl);
    client.log.logAndReply(message, `🤖  ${shortenedUrl} `);
    return;
}

const joinedChannelsCommand = async (client, message) => {
    message.command = 'dev joinedchannels';

    const authorId = message.senderUserID;
    if (authorId !== process.env.DEV_USERID) { return; }

    const joinedChannels = [...client.joinedChannels].length;
    const channelsToJoin = client.channelsToJoin.length;

    client.log.logAndReply(message, `🤖 ${joinedChannels}/${channelsToJoin}`);
    return;
}

const devJoinChannelCommand = async (client, message) => {
    message.command = 'dev join';

    const authorId = message.senderUserID;
    if (authorId !== process.env.DEV_USERID) { return; }

    const targetChannel = message.messageText.split(' ')[1]?.replace(/^@/, '').toLowerCase() || null;
    const announce = message.messageText.split(' ')[2] === 'true' ? true : false;

    if (!targetChannel) {
        client.log.logAndReply(message, `Use o formato: ${message.commandPrefix}devjoin <canal>`);
        return;
    }

    const channelConfigs = Array.from(Object.values(client.channelConfigs));
    if (!channelConfigs.some(channel => channel.channel === targetChannel)) {
        console.log(`* Creating new config for ${targetChannel}`);
        client.discord.log(`* Creating new config for ${targetChannel}`);
        createNewChannelConfig(client, targetChannel);
    }

    client.join(targetChannel);
    if (announce) {
        const emote = await client.emotes.getEmoteFromList(targetChannel, ['peepohey', 'heyge'], 'KonCha');
        client.log.send(targetChannel, `${emote} Oioi! Fui convidado para me juntar aqui! Para saber mais sobre mim, pode usar !ajuda ou !comandos`);
    }
    client.log.logAndReply(message, `🤖 Criei config e entrei no canal ${targetChannel}`);
    return;
}

const devPartChannelCommand = async (client, message) => {
    message.command = 'dev part';

    const authorId = message.senderUserID;
    if (authorId !== process.env.DEV_USERID) { return; }

    const targetChannel = message.messageText.split(' ')[1]?.replace(/^@/, '').toLowerCase() || null;

    if (!targetChannel) {
        client.log.logAndReply(message, `Use o formato: ${message.commandPrefix}devpart < canal > `);
        return;
    }

    // delete config
    await client.db.delete('config', { channel: targetChannel });
    await client.reloadChannelConfigs();
    await client.reloadChannelPrefixes();

    client.part(targetChannel);
    client.log.logAndReply(message, `🤖 Apaguei config a saí do canal ${targetChannel} `);
    return;
}

const giveXpCommand = async (client, message) => {
    message.command = 'dev givexp';

    const authorId = message.senderUserID;
    if (authorId !== process.env.DEV_USERID) { return; }

    const targetUser = message.messageText.split(' ')[1]?.replace(/^@/, '').toLowerCase();
    if (!targetUser) {
        client.log.logAndReply(message, `Use o formato: ${message.commandPrefix}givexp <usuário> <xp>`);
        return;
    }
    const targetUserId = await client.getUserID(targetUser);
    if (!targetUserId) {
        client.log.logAndReply(message, `Esse usuário não existe`);
        return;
    }

    const xp = message.messageText.split(' ')[2];
    if (!xp || isNaN(xp)) {
        client.log.logAndReply(message, `Use o formato: ${message.commandPrefix}givexp <usuário> <xp>`);
        return;
    }

    await client.db.update('dungeon', { userId: targetUserId }, { $inc: { xp: parseInt(xp) } });
    const newXp = await client.db.get('dungeon', { userId: targetUserId });
    client.log.logAndReply(message, `🤖 ${targetUser} XP modificado: [${xp.includes('-') ? `${xp}` : `+${xp}`} ⇒ ${newXp[0].xp}]`);
    return;
}


botSayCommand.aliases = ['botsay', 'bsay'];
forceJoinCommand.aliases = ['forcejoin', 'fjoin'];
forcePartCommand.aliases = ['forcepart', 'fpart'];
execCommand.aliases = ['exec', 'eval'];
sqlExecCommand.aliases = ['sqlexec', 'sql'];
getUserIdCommand.aliases = ['getuserid', 'uid'];
restartCommand.aliases = ['restart'];
resetPetCommand.aliases = ['resetpet', 'resetpat'];
resetCdCommand.aliases = ['resetcd'];
reloadCommand.aliases = ['reload'];
reloadDbCommand.aliases = ['reloaddb', 'reloadbd'];
gitPullCommand.aliases = ['gitpull', 'gpull'];
reloadEmotesCommand.aliases = ['reloademotes'];
allEmotesCommand.aliases = ['allemotes'];
devBanCommand.aliases = ['devban', 'dban'];
unbanDevCommand.aliases = ['devunban', 'dunban'];
shortenCommand.aliases = ['shorten'];
joinedChannelsCommand.aliases = ['joinedchannels', 'jchannels'];
devJoinChannelCommand.aliases = ['devjoin', 'djoin'];
devPartChannelCommand.aliases = ['devpart', 'dpart'];
giveXpCommand.aliases = ['devgivexp', 'givexp'];

module.exports = {
    botSayCommand,
    forceJoinCommand,
    forcePartCommand,
    execCommand,
    sqlExecCommand,
    getUserIdCommand,
    restartCommand,
    resetPetCommand,
    resetCdCommand,
    reloadCommand,
    reloadDbCommand,
    gitPullCommand,
    reloadEmotesCommand,
    allEmotesCommand,
    devBanCommand,
    unbanDevCommand,
    shortenCommand,
    joinedChannelsCommand,
    devJoinChannelCommand,
    devPartChannelCommand,
    giveXpCommand,
};
