const { timeSince } = require('../utils/utils.js');
const { afkInfoObjects } = require('../commands/afk/afk_info_model.js');

const afkUserListener = async (client, message) => {
    if (!client.afkUsers[message.channelName]) { return; }
    if (!client.afkUsers[message.channelName].includes(message.senderUsername)) { return; }

    var afkStats = await client.db.get('afk', { channel: message.channelName, user: message.senderUsername });
    if (afkStats.length === 0) { return; }

    afkStats = afkStats[0];

    if (!afkStats.is_afk) { return; } // should never happen but just in case

    const afkInfoObject = afkInfoObjects.find(afk => afk.alias.includes(afkStats.afk_type));
    const afkReturned = afkInfoObject.returned;
    const afkEmoji = afkInfoObject.emoji;
    const afkMessage = afkStats.afk_message;
    const afkSince = timeSince(afkStats.afk_since);

    client.log.send(message.channelName, `${message.senderUsername} ${afkReturned} ${afkEmoji} ${afkMessage ? `: ${afkMessage}` : ''} (afk por ${afkSince})`);
    await client.db.update('afk', { channel: message.channelName, user: message.senderUsername }, { $set: { is_afk: false, afk_return: Math.floor(Date.now() / 1000) } });
    client.reloadAfkUsers();
    return;
}

const reminderListener = async (client, message) => {
    if (!client.usersWithPendingReminders.includes(message.senderUserID)) { return; }
    if (client.notifiedUsers.includes(message.senderUserID)) { return; }

    var reminders = await client.db.get('remind', { receiverId: message.senderUserID, beenRead: false });
    if (reminders.length === 0) { return; } // should never happen but just in case

    if (reminders.length <= 3) {
        var replyMsg = `${message.senderUsername}, você tem ${reminders.length} lembrete${reminders.length > 1 ? 's' : ''} pendente${reminders.length > 1 ? 's' : ''} pendente${reminders.length > 1 ? 's' : ''}:`;
        const firstThreeReminders = reminders.slice(0, 3);
        for (const reminder of firstThreeReminders) {
            var remindSender = await client.getUserByUserID(reminder.senderId);
            var remindTimeSince = timeSince(reminder.remindTime);
            replyMsg += ` @${remindSender} (${remindTimeSince}): ${reminder.remindMessage}` + (reminder._id === firstThreeReminders[firstThreeReminders.length - 1]._id ? '' : ';');
        }

        if (replyMsg.length > 480) {
            client.log.send(message.channelName, `${message.senderUsername}, você tem ${reminders.length} lembretes pendentes. Use o comando ${message.commandPrefix}remind <show> para ver os IDs dos lembretes`);
            client.notifiedUsers.push(message.senderUserID);
            return;
        }

        client.log.send(message.channelName, replyMsg);
        
        for (const reminder of firstThreeReminders) {
            await client.db.update('remind', { _id: reminder._id }, { $set : { beenRead: true } });
        }
        client.reloadReminders();
        return;
    } 

    client.log.send(message.channelName, `${message.senderUsername}, você tem ${reminders.length} lembretes pendentes. Use o comando ${message.commandPrefix}remind <show> para ver os IDs dos lembretes. Pode também user ${message.commandPrefix}remind <show all> para ver todos os lembretes de uma vez`);
    client.notifiedUsers.push(message.senderUserID);
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
        console.log(`User found in DB. updating aliases: ${knownUsersDB[0].currAlias} -> ${message.senderUsername}`);
        
        await client.db.update('users', { userid: message.senderUserID }, { $set: { currAlias: message.senderUsername }, $push: { aliases: message.senderUsername } });
        client.knownUserAliases = client.knownUserAliases.filter(alias => alias !== knownUsersDB[0].currAlias);
        client.knownUserAliases.push(message.senderUsername);

        if (client.channelConfigs[knownUsersDB[0].currAlias]) {
            console.log(`Updating channel config for ${knownUsersDB[0].currAlias} -> ${message.senderUsername}`);
            await client.db.update('config', { channel: knownUsersDB[0].currAlias.toLowerCase() }, { $set: { channel: message.senderUsername} });
            client.join(message.senderUsername);
            client.log.send(message.senderUsername, `Troca de nick detetada (${knownUsersDB[0].currAlias} -> ${message.senderUsername})`);
            await client.reloadChannelConfigs();
            await client.reloadChannelPrefixes();
        }

        await updateLastSeen(client, message);
        return;
    }

    console.log(`NEW USER: ${message.channelName}/${message.senderUsername}`);

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
        optoutOwnChannel: false,
        msgCount: { total: 1, [message.channelName]: 1 },
    });

    client.knownUserAliases.push(message.senderUsername);    
}


module.exports = { 
    afkUserListener,
    reminderListener,
    updateUserListener,
};