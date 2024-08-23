const { processCommand } = require("../../utils/processCommand.js");
const { manageLongResponse, createNewGist, timeSince, parseTime } = require("../../utils/utils.js");

async function newRemind(client, message, targetId, remindMessage, remindAt) {
    const newRemindId = await client.db.count('remind') + 1;
    const remindInfo = {
        _id: newRemindId,
        senderId: message.senderUserID,
        receiverId: targetId,
        fromChannelId: message.channelID,
        remindMessage: remindMessage,
        remindTime: Math.floor(Date.now() / 1000),
        remindAt: remindAt,
        beenRead: false,
    };

    await client.db.insert('remind', remindInfo);
    return newRemindId;
}

const remindCommand = async (client, message) => {
    message.command = 'remind';
    if (!await processCommand(5000, 'user', message, client)) return;

    if (message.messageText.split(' ').length === 1) {
        client.log.logAndReply(message, `Use o formato: ${message.commandPrefix}remind <usuário> <mensagem>`);
        return;
    }
    
    var targetUser = message.messageText.split(' ')[1]?.replace(/^@/, '').toLowerCase()

    if (['del', 'delete', 'apagar'].includes(targetUser)) {
        const reminderId = message.messageText.split(' ')[2];
        
        if (isNaN(reminderId)) {
            client.log.logAndReply(message, `Use o formato: ${message.commandPrefix}remind delete <ID do lembrete>`);
            return;
        }

        var remindInfo = await client.db.get('remind', { _id: parseInt(reminderId) });
        if (remindInfo.length === 0) {
            client.log.logAndReply(message, `Não existe nenhum lembrete com esse ID`);
            return;
        }

        remindInfo = remindInfo[0];
        if (remindInfo.beenRead) {
            client.log.logAndReply(message, `Esse lembrete já foi aberto`);
            return;
        }

        if (remindInfo.senderId !== message.senderUserID) {
            client.log.logAndReply(message, `Você não é o criador desse lembrete`);
            return;
        }

        const emote = await client.emotes.getEmoteFromList(message.channelName, ['joia', 'jumilhao'], '👍');
        client.log.logAndReply(message, `Lembrete apagado ${emote}`);
        await client.db.update('remind', { _id: parseInt(reminderId) }, { beenRead: true });
        await client.reloadReminders();
        return;
    }

    if (['show', 'open'].includes(targetUser)) {
        if (!client.usersWithPendingReminders.includes(message.senderUserID)) {
            client.log.logAndReply(message, `Você não tem lembretes pendentes`);
            return;
        }

        if (message.messageText.split(' ').length === 2) {
            const remindInfo = await client.db.get('remind', { receiverId: message.senderUserID, beenRead: false });

            var pendingReminders = [];
            remindInfo.forEach((reminder) => {
                pendingReminders.push(`${reminder._id}`);
            });

            var finalRes = `Você tem estes lembretes pendentes: ${pendingReminders}`;
            if (finalRes.length > 480) { finalRes = await manageLongResponse(finalRes); }
            
            client.log.logAndReply(message, finalRes);
            return;
        }

        const reminderId = message.messageText.split(' ')[2];

        if (reminderId === 'all') {
            const remindInfo = await client.db.get('remind', { receiverId: message.senderUserID, beenRead: false });

            var pendingReminders = ``;
            var reminderSenders = {};

            for (const reminder of remindInfo) {
                if (!reminderSenders[reminder.senderId]) {
                    var reminderSender = await client.getUserByUserID(reminder.senderId) || 'Usuário deletado';
                    reminderSenders[reminder.senderId] = reminderSender;
                }

                pendingReminders += `ID: ${reminder._id} de @${reminderSenders[reminder.senderId]} há ${timeSince(reminder.remindTime)}:\n${reminder.remindMessage}\n\n`;
            }
            
            pendingReminders = await createNewGist(pendingReminders);
            client.log.logAndReply(message, `Para ver todos os seus lembretes, acesse: ${pendingReminders}`);
            await client.db.updateMany('remind', { receiverId: message.senderUserID }, { $set: { beenRead: true } });
            await client.reloadReminders();
            return;
        }

        if (isNaN(reminderId)) {
            client.log.logAndReply(message, `Use o formato: ${message.commandPrefix}remind show <ID do lembrete>`);
            return;
        }

        var remindInfo = await client.db.get('remind', { _id: parseInt(reminderId), beenRead: false });
        if (remindInfo.length === 0) {
            client.log.logAndReply(message, `Não existe nenhum lembrete pendente com esse ID`);
            return;
        }

        remindInfo = remindInfo[0];
        if (remindInfo.receiverId !== message.senderUserID && remindInfo.senderId !== message.senderUserID) {
            client.log.logAndReply(message, `Você não é o criador nem o destinatário desse lembrete`);
            return;
        }

        var reminderSender = await client.getUserByUserID(remindInfo.senderId) || 'Usuário deletado';
        var finalRes = `Lembrete de @${reminderSender} há ${timeSince(remindInfo.remindTime)}: ${remindInfo.remindMessage}`;
        if (finalRes.length > 480) { finalRes = await manageLongResponse(finalRes); }

        client.log.logAndReply(message, finalRes);
        await client.db.update('remind', { _id: parseInt(reminderId) }, { beenRead: true });
        await client.reloadReminders();
        return;
    }

    if (['folhinha', 'folhinhabot'].includes(targetUser)) {
        client.log.logAndReply(message, `Stare que foi ow`);
        return;
    }

    if (['me', message.senderUsername].includes(targetUser)) {
        targetUser = message.senderUsername;
    }

    const targetId = await client.getUserID(targetUser);
    if (!targetId) {
        client.log.logAndReply(message, `Esse usuário não existe`);
        return;
    }

    // const timeRegex = /in (\d+)([smhd])/;
    // var timeMatch = message.messageText.match(timeRegex);
    // const remindMessage = message.messageText.split(' ').slice(2).join(' ').replace(timeRegex, '');
    
    
    const timeRegex = /in (\d+d)?\s*(\d+h)?\s*(\d+m)?\s*(\d+s)?/;
    let totalSeconds = 0;
    var timeMatch = message.messageText.tolowerCase().match(timeRegex);
    
    if (timeMatch) {
        if (timeMatch[1]) totalSeconds += parseTime(timeMatch[1], 'd');
        if (timeMatch[2]) totalSeconds += parseTime(timeMatch[2], 'h');
        if (timeMatch[3]) totalSeconds += parseTime(timeMatch[3], 'm');
        if (timeMatch[4]) totalSeconds += parseTime(timeMatch[4], 's');
    }
    
    const remindMessage = message.messageText.split(' ').slice(2).join(' ').replace(timeRegex, '').trim();
    
    const remindAt = totalSeconds ? Math.floor(Date.now() / 1000) + totalSeconds : null;
    console.log(Math.floor(Date.now() / 1000));
    console.log(remindAt);
    
    if (!remindMessage) {
        client.log.logAndReply(message, `Use o formato: ${message.commandPrefix}remind <usuário> in <tempo> <mesnsagem> (ex: in 10s/10m/10h/10d)`);
        return;
    }
    
    if (timeMatch && (remindAt === null || remindAt === Math.floor(Date.now() / 1000))) {
        client.log.logAndReply(message, `Use o formato: ${message.commandPrefix}remind <usuário> in <tempo> <mensagem> (ex: in 10s/10m/10h/10d). O tempo mínimo em lembretes cronometrados é de 1 minuto`);
        return;
    }
    
    if (timeMatch && remindAt - Math.floor(Date.now() / 1000) < 60) {
        client.log.logAndReply(message, `O tempo mínimo em lembretes cronometrados é de 1 minuto`);
        return;
    }
    
    
    const newRemindId = await newRemind(client, message, targetId, remindMessage, remindAt);
    
    const emote = await client.emotes.getEmoteFromList(message.channelName, ['noted'], '📝');
    client.log.logAndReply(message, `${targetUser !== message.senderUsername ? `@${targetUser}` : 'Você'} vai ser lembrado disso ${timeMatch ? timeMatch[0].replace('in', 'em') : 'assim que falar no chat'} ${emote} (ID ${newRemindId})`);
    await client.reloadReminders();
    client.notifiedUsers = client.notifiedUsers.filter(id => id !== targetId); // Remove user from notifiedUsers
    return;
};

remindCommand.aliases = ['remind', 'lembrete'];

module.exports = {
    remindCommand,
};