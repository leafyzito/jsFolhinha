import { processCommand } from '../../utils/processCommand.js';
import {
    manageLongResponse,
    createNewGist,
    timeSince,
    parseTime,
    isStreamOnline,
} from '../../utils/utils.js';
import schedule from 'node-schedule';

async function newRemind(client, message, targetId, remindMessage, remindAt) {
    const newRemindId = (await client.db.count('remind', {}, true)) + 1;
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
    if (!(await processCommand(5000, 'user', message, client))) return;

    if (message.messageText.split(' ').length === 1) {
        client.log.logAndReply(
            message,
            `Use o formato: ${message.commandPrefix}remind <usuário> <mensagem>`
        );
        return;
    }

    let targetUser = message.messageText.split(' ')[1]?.replace(/^@/, '').toLowerCase();

    if (['del', 'delete', 'apagar'].includes(targetUser)) {
        const reminderId = message.messageText.split(' ')[2];

        if (isNaN(reminderId)) {
            client.log.logAndReply(
                message,
                `Use o formato: ${message.commandPrefix}remind delete <ID do lembrete>`
            );
            return;
        }

        let remindInfo = await client.db.get('remind', { _id: parseInt(reminderId) });
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

        const emote = await client.emotes.getEmoteFromList(
            message.channelName,
            ['joia', 'jumilhao'],
            '👍'
        );
        client.log.logAndReply(message, `Lembrete apagado ${emote}`);
        await client.db.update(
            'remind',
            { _id: parseInt(reminderId) },
            { $set: { beenRead: true } }
        );
        // await client.reloadReminders();
        // remove userid from client.usersWithPendingReminders
        client.usersWithPendingReminders = client.usersWithPendingReminders.filter(
            id => id !== remindInfo.receiverId
        );

        // cancel the cron job
        if (client.reminderJobs[reminderId]) {
            client.reminderJobs[reminderId].cancel();
            delete client.reminderJobs[reminderId];
        }
        return;
    }

    if (['show', 'open'].includes(targetUser)) {
        if (!client.usersWithPendingReminders.includes(message.senderUserID)) {
            client.log.logAndReply(message, `Você não tem lembretes pendentes`);
            return;
        }

        if (message.messageText.split(' ').length === 2) {
            let remindInfo = await client.db.get('remind', {
                receiverId: message.senderUserID,
                beenRead: false,
                remindAt: null,
            });

            let pendingReminders = [];
            remindInfo.forEach(reminder => {
                pendingReminders.push(`${reminder._id}`);
            });

            let finalRes = `Você tem estes lembretes: ${pendingReminders.join(', ')}`;
            if (finalRes.length > 480) {
                finalRes = await manageLongResponse(finalRes);
            }

            client.log.logAndReply(message, finalRes);
            return;
        }

        const reminderId = message.messageText.split(' ')[2];

        if (reminderId === 'all') {
            let remindInfo = await client.db.get('remind', {
                receiverId: message.senderUserID,
                beenRead: false,
            });

            let pendingReminders = ``;
            let reminderSenders = {};

            for (let reminder of remindInfo) {
                if (!reminderSenders[reminder.senderId]) {
                    let reminderSender =
                        (await client.getUserByUserID(reminder.senderId)) || 'Usuário deletado';
                    reminderSenders[reminder.senderId] = reminderSender;
                }

                pendingReminders += `ID: ${reminder._id} de @${reminderSenders[reminder.senderId]} há ${timeSince(reminder.remindTime)}:\n${reminder.remindMessage}\n\n`;
            }

            pendingReminders = await createNewGist(pendingReminders);
            client.log.logAndReply(
                message,
                `Para ver todos os seus lembretes, acesse: ${pendingReminders}`
            );
            await client.db.updateMany(
                'remind',
                { receiverId: message.senderUserID },
                { $set: { beenRead: true } }
            );
            // await client.reloadReminders();
            // remove userid from client.usersWithPendingReminders
            client.usersWithPendingReminders = client.usersWithPendingReminders.filter(
                id => id !== message.senderUserID
            );
            return;
        }

        if (isNaN(reminderId)) {
            client.log.logAndReply(
                message,
                `Use o formato: ${message.commandPrefix}remind show <ID do lembrete>`
            );
            return;
        }

        let remindInfo = await client.db.get('remind', {
            _id: parseInt(reminderId),
            beenRead: false,
        });
        if (remindInfo.length === 0) {
            client.log.logAndReply(message, `Não existe nenhum lembrete pendente com esse ID`);
            return;
        }

        remindInfo = remindInfo[0];
        if (
            remindInfo.receiverId !== message.senderUserID &&
            remindInfo.senderId !== message.senderUserID
        ) {
            client.log.logAndReply(
                message,
                `Você não é o criador nem o destinatário desse lembrete`
            );
            return;
        }

        let reminderSender =
            (await client.getUserByUserID(remindInfo.senderId)) || 'Usuário deletado';
        let finalRes = `Lembrete de @${reminderSender} há ${timeSince(remindInfo.remindTime)}: ${remindInfo.remindMessage}`;
        if (finalRes.length > 480) {
            finalRes = await manageLongResponse(finalRes);
        }

        client.log.logAndReply(message, finalRes);
        await client.db.update(
            'remind',
            { _id: parseInt(reminderId) },
            { $set: { beenRead: true } }
        );
        // await client.reloadReminders();
        // remove userid from client.usersWithPendingReminders if there are no more pending reminders
        let hasMorePendingReminders = await client.db.get('remind', {
            receiverId: message.senderUserID,
            beenRead: false,
        });
        if (hasMorePendingReminders.length === 0) {
            client.usersWithPendingReminders = client.usersWithPendingReminders.filter(
                id => id !== message.senderUserID
            );
        }
        return;
    }

    if (['block', 'bloquear'].includes(targetUser)) {
        let targetUser = message.messageText.split(' ')[2]?.replace(/^@/, '');
        if (!targetUser) {
            client.log.logAndReply(
                message,
                `Use o formato: ${message.commandPrefix}remind block <usuário>`
            );
            return;
        }

        let targetUserId = await client.getUserID(targetUser);
        if (!targetUserId) {
            client.log.logAndReply(message, `Esse usuário não existe`);
            return;
        }

        if (targetUserId === message.senderUserID) {
            client.log.logAndReply(message, `Você não pode se bloquear a você mesmo Stare`);
            return;
        }

        await client.db.update(
            'users',
            { userid: message.senderUserID },
            { $push: { 'blocks.remind': targetUserId } }
        );
        client.log.logAndReply(
            message,
            `Você bloqueou ${targetUser} de usar comandos remind para você`
        );
        return;
    }

    if (['unblock', 'desbloquear'].includes(targetUser)) {
        let targetUser = message.messageText.split(' ')[2]?.replace(/^@/, '');
        if (!targetUser) {
            client.log.logAndReply(
                message,
                `Use o formato: ${message.commandPrefix}remind unblock <usuário>`
            );
            return;
        }

        let targetUserId = await client.getUserID(targetUser);
        if (!targetUserId) {
            client.log.logAndReply(message, `Esse usuário não existe`);
            return;
        }

        if (targetUserId === message.senderUserID) {
            client.log.logAndReply(message, `Você não pode se desbloquear a você mesmo Stare`);
            return;
        }

        await client.db.updateMany(
            'users',
            { userid: message.senderUserID },
            { $pull: { 'blocks.remind': targetUserId } }
        );
        client.log.logAndReply(
            message,
            `Você desbloqueou ${targetUser} de usar comandos remind para você`
        );
        return;
    }

    if (['folhinha', 'folhinhabot'].includes(targetUser)) {
        client.log.logAndReply(message, `Stare que foi ow`);
        return;
    }

    if (['me', message.senderUsername].includes(targetUser)) {
        targetUser = message.senderUsername;
    }

    let targetUserId = await client.getUserID(targetUser);
    if (!targetUserId) {
        client.log.logAndReply(message, `Esse usuário não existe`);
        return;
    }

    let totalSeconds = 0;
    let timeParts = message.messageText.split(' ');
    let timeIndex = timeParts[2]?.toLowerCase() === 'in' ? 3 : null;
    let days =
        timeParts[timeIndex] &&
        ['d', 'day', 'days'].some(suffix => timeParts[timeIndex].toLowerCase().endsWith(suffix))
            ? timeParts[timeIndex]
            : null;
    if (days && !isNaN(parseInt(days))) timeIndex++;
    let hours =
        timeParts[timeIndex] &&
        ['h', 'hrs', 'hour', 'hours'].some(suffix =>
            timeParts[timeIndex].toLowerCase().endsWith(suffix)
        )
            ? timeParts[timeIndex]
            : null;
    if (hours && !isNaN(parseInt(hours))) timeIndex++;
    let minutes =
        timeParts[timeIndex] &&
        ['m', 'min', 'mins', 'minute', 'minutes'].some(suffix =>
            timeParts[timeIndex].toLowerCase().endsWith(suffix)
        )
            ? timeParts[timeIndex]
            : null;
    if (minutes && !isNaN(parseInt(minutes))) timeIndex++;
    let seconds =
        timeParts[timeIndex] &&
        ['s', 'sec', 'secs', 'second', 'seconds'].some(suffix =>
            timeParts[timeIndex].toLowerCase().endsWith(suffix)
        )
            ? timeParts[timeIndex]
            : null;
    if (seconds && !isNaN(parseInt(seconds))) timeIndex++;

    if (days && !isNaN(parseInt(days))) totalSeconds += parseTime(days, 'd');
    if (hours && !isNaN(parseInt(hours))) totalSeconds += parseTime(hours, 'h');
    if (minutes && !isNaN(parseInt(minutes))) totalSeconds += parseTime(minutes, 'm');
    if (seconds && !isNaN(parseInt(seconds))) totalSeconds += parseTime(seconds, 's');

    if (isNaN(totalSeconds)) {
        client.log.logAndReply(
            message,
            `Use o formato: ${message.commandPrefix}remind <usuário> in <tempo> <mensagem> (ex: in 10s/10m/10h/10d). Se o erro persistir, contacte o @${process.env.DEV_NICK}`
        );
        return;
    }

    if (timeIndex === null) {
        timeIndex = 2;
    }
    let remindMessage = message.messageText.split(' ').slice(timeIndex).join(' ').trim();

    let remindAt = totalSeconds ? Math.floor(Date.now() / 1000) + totalSeconds : null;
    console.log(Math.floor(Date.now() / 1000));
    console.log(remindAt);

    if (!remindMessage) {
        remindMessage = '(sem mensagem)';
    }

    if (timeParts.includes('in') && (days || hours || minutes || seconds) && !totalSeconds) {
        client.log.logAndReply(
            message,
            `Use o formato: ${message.commandPrefix}remind <usuário> in <tempo> <mensagem> (ex: in 10s/10m/10h/10d).`
        );
        return;
    }

    if (totalSeconds && totalSeconds < 60) {
        client.log.logAndReply(message, `O tempo mínimo em lembretes cronometrados é de 1 minuto`);
        return;
    }

    // max time limit is 5 years
    if (totalSeconds && totalSeconds > 157_784_630) {
        client.log.logAndReply(message, `O tempo máximo em lembretes cronometrados é de 5 anos`);
        return;
    }

    // if (targetUser === message.senderUsername && !totalSeconds) {
    //     client.log.logAndReply(message, `Use o formato: ${message.commandPrefix}remind me in <tempo> <mensagem> (ex: in 10s/10m/10h/10d)`);
    //     return;
    // }

    console.log(totalSeconds);

    // check user optout and reminder blocks
    let targetUserInfo = await client.db.get('users', { userid: targetUserId });
    targetUserInfo = targetUserInfo[0];

    // if exists in logs, check for stuff. if not, skip and create remind anyway
    if (targetUserInfo) {
        if (targetUserInfo.optoutRemind) {
            client.log.logAndReply(
                message,
                `Esse usuário optou por não ser alvo de comandos remind 🚫`
            );
            return;
        }

        if (targetUserInfo.blocks && targetUserInfo.blocks.remind) {
            if (targetUserInfo.blocks.remind.includes(message.senderUserID)) {
                client.log.logAndReply(
                    message,
                    `Esse usuário bloqueou você de usar comandos remind para ele 🚫`
                );
                return;
            }
        }
    }

    // create remind
    let newRemindId = await newRemind(client, message, targetUserId, remindMessage, remindAt);

    const emote = await client.emotes.getEmoteFromList(message.channelName, ['noted'], '📝');
    client.log.logAndReply(
        message,
        `Vou lembrar ${targetUser !== message.senderUsername ? `@${targetUser}` : 'você'} disso ${totalSeconds ? `em ${days ? `${days} ` : ''}${hours ? `${hours} ` : ''}${minutes ? `${minutes} ` : ''}${seconds ? `${seconds} ` : ''}` : 'assim que falar no chat'} ${emote} (ID ${newRemindId})`,
        remindAt
            ? new Date(remindAt * 1000).toLocaleString('pt-PT', { timeZone: 'Europe/Lisbon' })
            : null
    );
    // await client.reloadReminders();
    // add userid to client.usersWithPendingReminders
    client.usersWithPendingReminders.push(targetUserId);

    // if it is a scheduled remind, add it to client.reminderJobs
    let remindCreateTime = Math.floor(Date.now() / 1000);
    if (remindAt) {
        let job = schedule.scheduleJob(new Date(remindAt * 1000), async function () {
            // verify the remind has not been deleted on website, force check in db
            let remindDeletionCheck = await client.db.get('remind', { _id: newRemindId }, true);
            if (remindDeletionCheck.length != 0 && remindDeletionCheck[0].beenRead) {
                return;
            }

            let reminderSender =
                (await client.getUserByUserID(message.senderUserID)) || 'Usuário deletado';
            let reminderTime = timeSince(remindCreateTime);
            let finalRes =
                reminderSender === targetUser
                    ? `@${targetUser}, lembrete de você mesmo há ${reminderTime}: ${remindMessage}`
                    : `@${targetUser}, lembrete de @${reminderSender} há ${reminderTime}: ${remindMessage}`;

            if (finalRes.length > 480) {
                finalRes = await manageLongResponse(finalRes);
            }

            // check if channel is still in configs and check for if it's paused, reminds are banned and offlineOnly
            if (
                !client.channelConfigs[message.channelName] ||
                client.channelConfigs[message.channelName].isPaused ||
                client.channelConfigs[message.channelName].disabledCommands.includes('remind') ||
                (client.channelConfigs[message.channelName].offlineOnly &&
                    (await isStreamOnline(message.channelName)))
            ) {
                // send in whisper to receiverName if channel is paused, reminds are banned or offlineOnly with stream online
                await client.log.whisper(targetUser, finalRes);
                await client.db.update(
                    'remind',
                    { _id: newRemindId },
                    { $set: { beenRead: true } }
                );
            } else {
                // send in channel if channel is not paused, reminds are not banned and not offlineOnly
                await client.log.send(message.channelName, finalRes);
                await client.db.update(
                    'remind',
                    { _id: newRemindId },
                    { $set: { beenRead: true } }
                );
            }
        });

        client.reminderJobs[newRemindId] = job;
    }

    client.notifiedUsers = client.notifiedUsers.filter(id => id !== targetUserId); // Remove user from notifiedUsers
    return;
};

remindCommand.commandName = 'remind';
remindCommand.aliases = ['remind', 'lembrar'];
remindCommand.shortDescription = 'Deixe um lembrete para algum usuário do chat';
remindCommand.cooldown = 5000;
remindCommand.whisperable = false;
remindCommand.description = `Use este comando para deixar um lembrete para a próxima vez que um usuário falar no chat
Pode deixar um lembrete para si mesmo ou para outra pessoa
Este comando funciona independetemente do chat em que esteja, ou seja, se você marcar um lembrete para você mesmo em um chat, se você falar em outro, o bot irá lhe lembrar do que foi deixado no recado
• Exemplo: !remind me Faz aquilo lá - O bot irá lembrar de "Fazer aquilo lá" a pessoa que executou o comando assim que voltar a falar em qualquer chat, juntamente com o ID do lembrete criado
• Exemplo: !remind @leafyzito Faz aquilo lá - O bot irá lembrar @leafyzito de "Fazer aquilo lá" assim que @leafyzito falar no chat, juntamente com o ID do lembrete criado

Pode também deixar um lembretes cronometrados, para que apenas quando passado o tempo especificado, o bot lembrar X usuario de algo:
• Exemplo: !remind me in 10m Faz aquilo lá - O bot irá lembrar quem executou o comando de "Fazer aquilo lá" 10 minutos depois de ter criado o lembrete, independentemente de falar no chat ou não
• Exemplo: !remind @leafyzito in 15d 10h - @leafyzito será lembrado passado 15 dias e 10 horas de criar o lembrete

Atenção que o formato de tempos devem ser sempre seguindo este padrão:
10d - 10 dias; usar 10 days não vai funcionar
10h 50s - 10 horas e 50 segundos; usar 10h50s ou 10h e 50s não vai funcionar

Existe também o !remind show, que será apenas útil quando tiver múltiplos lembretes pendentes, que mostra uma lista de todos os lembretes pendentes
Juntamente do !remind show, tem o !remind show {ID de algum lembrete pendente} que irá mostrar apenas o lembrete do ID fornecido
Existe também o !remind show all que irá juntar todos os lembretes pendentes, sejam eles 5 ou 100, e irá mandar em um link com todos os lembretes em lista para poder lê-los a todos
Se for necessário você usar este comando para ver os seus lembretes, o Folhinha irá lhe avisar disso

Caso queira apagar algum lembrete, use o comando !remind delete {ID do lembrete}

Por fim, se quiser bloquear lembretes de algum usuário em específico basta usar !remind block/unblock`;
remindCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/${remindCommand.commandName}/${remindCommand.commandName}.js`;

export { remindCommand };
