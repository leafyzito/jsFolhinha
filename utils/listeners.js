const { timeSince, randomChoice } = require('../utils/utils.js');
const { afkInfoObjects } = require('../commands/afk/afk_info_model.js');

var lastReplyTime = {};
const replyMentionListener = async (client, message) => {
    if (message.messageText.startsWith(message.commandPrefix)) { return; }

    const currentTime = Date.now();
    const timeDifference = currentTime - lastReplyTime[message.channelName];
    if (timeDifference < 15000) { return; }

    const msgContent = message.messageText.split(' ');
    if (msgContent.length === 1 && (msgContent[0].toLowerCase() === 'folhinha' || msgContent[0].toLowerCase() === 'folhinhabot' || msgContent[0].toLowerCase() === '@folhinhabot' || msgContent[0].toLowerCase() === '@folhinhabot,')) {
        const channelEmotes = await client.emotes.getChannelEmotes(message.channelName) || [];
        client.log.send(message.channelName, `${message.senderUsername} ${channelEmotes.length > 0 ? randomChoice(channelEmotes) : 'KonCha'}`);
        lastReplyTime[message.channelName] = currentTime;
        return;
    }

    if (msgContent.length === 2 && ['folhinha', 'folhinhabot', '@folhinhabot', '@folhinhabot,'].some(word => msgContent.some(msg => msg.toLowerCase() === word.toLowerCase()))) {
        var otherWord = msgContent.find(msg => msg.toLowerCase() !== 'folhinha' && msg.toLowerCase() !== 'folhinhabot');

        if (['oi', 'ola', 'olá', 'opa'].some(word => word === otherWord.toLowerCase())) {
            const emote = await client.emotes.getEmoteFromList(message.channelName, ['peepohey', 'peeposhy', 'eba', 'ola'], 'KonCha');
            client.log.send(message.channelName, `Oioi ${message.senderUsername} ${emote}`);
            lastReplyTime[message.channelName] = currentTime;
            return;
        }

        const channelEmotes = await client.emotes.getChannelEmotes(message.channelName);
        if (!channelEmotes.some(emote => emote === otherWord)) {
            otherWord = channelEmotes.length > 0 ? randomChoice(channelEmotes) : 'KonCha';
        }

        client.log.send(message.channelName, `${message.senderUsername} ${otherWord}`);
        lastReplyTime[message.channelName] = currentTime;
        return;
    }
}

let processingAfk = [];
const afkUserListener = async (client, message) => {
    if (!client.afkUsers[message.channelName]) { return; }
    if (!client.afkUsers[message.channelName].includes(message.senderUsername)) { return; }
    if (processingAfk.includes(message.senderUsername)) { return; }

    processingAfk.push(message.senderUsername);

    var afkStats = await client.db.get('afk', { channel: message.channelName, user: message.senderUsername });
    if (afkStats.length === 0) {
        processingAfk = processingAfk.filter(user => user !== message.senderUsername);
        return;
    }

    afkStats = afkStats[0];

    if (!afkStats.is_afk) { // should never happen but just in case
        processingAfk = processingAfk.filter(user => user !== message.senderUsername);
        return;
    }

    const afkInfoObject = afkInfoObjects.find(afk => afk.alias.includes(afkStats.afk_type));
    const afkReturned = afkInfoObject.returned;
    const afkEmoji = afkInfoObject.emoji;
    const afkMessage = afkStats.afk_message;
    const afkSince = timeSince(afkStats.afk_since);

    client.log.send(message.channelName, `${message.senderUsername} ${afkReturned} ${afkEmoji} ${afkMessage ? `: ${afkMessage}` : ''} (afk por ${afkSince})`);
    await client.db.update('afk', { channel: message.channelName, user: message.senderUsername }, { $set: { is_afk: false, afk_return: Math.floor(Date.now() / 1000) } });
    // client.reloadAfkUsers();
    // remove user from client.afkUsers
    client.afkUsers[message.channelName] = client.afkUsers[message.channelName].filter(user => user !== message.senderUsername);
    processingAfk = processingAfk.filter(user => user !== message.senderUsername);
    return;
}

let processingReminder = [];
const reminderListener = async (client, message) => {
    if (!client.usersWithPendingReminders.includes(message.senderUserID)) { return; }
    if (client.notifiedUsers.includes(message.senderUserID)) { return; }
    if (processingReminder.includes(message.senderUsername)) { return; }

    processingReminder.push(message.senderUsername);

    var reminders = await client.db.get('remind', { receiverId: message.senderUserID, beenRead: false, remindAt: null });
    if (reminders.length === 0) { // should never happen but just in case
        processingReminder = processingReminder.filter(user => user !== message.senderUsername);
        return;
    }

    if (reminders.length <= 3) {
        var replyMsg = `${message.senderUsername}, você tem ${reminders.length} lembrete${reminders.length > 1 ? 's' : ''} pendente${reminders.length > 1 ? 's' : ''}: `;
        const firstThreeReminders = reminders.slice(0, 3);
        for (const reminder of firstThreeReminders) {
            var remindSender = await client.getUserByUserID(reminder.senderId);
            var remindTimeSince = timeSince(reminder.remindTime);
            replyMsg += ` @${remindSender} (${remindTimeSince}): ${reminder.remindMessage}` + (reminder._id === firstThreeReminders[firstThreeReminders.length - 1]._id ? '' : ';');
        }

        if (replyMsg.length > 480) {
            client.log.send(message.channelName, `${message.senderUsername}, você tem ${reminders.length} lembretes pendentes. Use o comando ${message.commandPrefix}remind <show> para ver os IDs dos lembretes`);
            client.notifiedUsers.push(message.senderUserID);
            processingReminder = processingReminder.filter(user => user !== message.senderUsername);
            return;
        }

        client.log.send(message.channelName, replyMsg);

        for (const reminder of firstThreeReminders) {
            await client.db.update('remind', { _id: reminder._id }, { $set: { beenRead: true } });
        }
        // client.reloadReminders();
        // remove userid from client.usersWithPendingReminders
        client.usersWithPendingReminders = client.usersWithPendingReminders.filter(id => id !== message.senderUserID);
        processingReminder = processingReminder.filter(user => user !== message.senderUsername);
        return;
    }

    client.log.send(message.channelName, `${message.senderUsername}, você tem ${reminders.length} lembretes pendentes. Use o comando ${message.commandPrefix}remind <show> para ver os IDs dos lembretes. Pode também usar ${message.commandPrefix}remind <show all> para ver todos os lembretes de uma vez`);
    client.notifiedUsers.push(message.senderUserID);
    processingReminder = processingReminder.filter(user => user !== message.senderUsername);
    return;
}



async function updateLastSeen(client, message) {

    const update_doc = {
        $set: {
            lsDate: Math.floor(Date.now() / 1000),
            lsChannel: message.channelName,
            lsMessage: message.messageText
        },
        $inc: {
            'msgCount.total': 1,
            [`msgCount.${message.channelName}`]: 1
        }
    };

    await client.db.update('users', { userid: message.senderUserID }, update_doc);
    return;
}

const updateUserListener = async (client, message) => {
    if (message.senderUsername === 'folhinhabot') { return; }

    if ([...client.knownUserAliases].includes(message.senderUsername)) { return await updateLastSeen(client, message); }

    const knownUsersDB = await client.db.get('users', { userid: message.senderUserID });
    if (knownUsersDB.length > 0) {
        client.discord.log(`* Updating user aliases: ${knownUsersDB[0].currAlias} -> ${message.senderUsername}`);
        console.log(`User found in DB. updating aliases: ${knownUsersDB[0].currAlias} -> ${message.senderUsername}`);

        await client.db.update('users', { userid: message.senderUserID }, { $set: { currAlias: message.senderUsername }, $push: { aliases: message.senderUsername } });
        client.knownUserAliases = client.knownUserAliases.filter(alias => alias !== knownUsersDB[0].currAlias);
        client.knownUserAliases.push(message.senderUsername);

        if (client.channelConfigs[knownUsersDB[0].currAlias]) {
            client.discord.log(`* Updating channel config for ${knownUsersDB[0].currAlias} -> ${message.senderUsername}`);
            console.log(`Updating channel config for ${knownUsersDB[0].currAlias} -> ${message.senderUsername}`);
            await client.db.update('config', { channel: knownUsersDB[0].currAlias.toLowerCase() }, { $set: { channel: message.senderUsername } });
            client.part(knownUsersDB[0].currAlias);
            client.join(message.senderUsername);
            client.log.send(message.senderUsername, `Troca de nick detetada (${knownUsersDB[0].currAlias} -> ${message.senderUsername})`);
            await client.reloadChannelConfigs();
            await client.reloadChannelPrefixes();

            // update channelsToJoin
            client.channelsToJoin = client.channelsToJoin.filter(channel => channel !== knownUsersDB[0].currAlias);
            client.channelsToJoin.push(message.senderUsername);
        }

        await updateLastSeen(client, message);
        return;
    }

    client.discord.log(`* NEW USER: #${message.channelName}/${message.senderUsername}`);
    console.log(`NEW USER: #${message.channelName}/${message.senderUsername}`);

    await client.db.insert('users', {
        userid: message.senderUserID,
        aliases: [message.senderUsername],
        currAlias: message.senderUsername,
        customAliases: [],
        lsChannel: message.channelName,
        lsMessage: message.messageText,
        lsDate: Math.floor(Date.now() / 1000),
        optoutLs: false,
        optoutStalk: false,
        optoutRemind: false,
        optoutOwnChannel: false,
        blocks: {},
        msgCount: { total: 1, [message.channelName]: 1 },
    });

    client.knownUserAliases.push(message.senderUsername);
}

const notifyDevMentionListener = async (client, message) => {
    const possibleDevMentions = process.env.DEV_POSSIBLE_MENTIONS.split(',');
    if (possibleDevMentions.some(mention => message.messageText.toLowerCase().includes(mention.toLowerCase()))) {
        client.discord.notifyDevMention(message);
    }
}


module.exports = {
    replyMentionListener,
    afkUserListener,
    reminderListener,
    updateUserListener,
    notifyDevMentionListener
};