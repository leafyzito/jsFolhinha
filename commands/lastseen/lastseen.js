import { processCommand } from '../../utils/processCommand.js';
import { timeSince } from '../../utils/utils.js';

const lastSeenCommand = async (client, message) => {
    message.command = 'lastseen';
    if (!(await processCommand(5000, 'channel', message, client))) return;

    if (message.messageText.split(' ').length === 1) {
        client.log.logAndReply(
            message,
            `Use o formato: ${message.commandPrefix}lastseen <usuário>`
        );
        return;
    }

    const targetUser = message.messageText.split(' ')[1].toLowerCase().replace(/^@/, '');

    if (targetUser === message.senderUsername) {
        client.log.logAndReply(message, `Você tá aqui mesmo Stare`);
        return;
    }

    if (['folhinha', 'folhinhabot'].includes(targetUser)) {
        client.log.logAndReply(message, `Eu tô aqui Stare`);
        return;
    }

    const targetUserId = await client.getUserID(targetUser);
    if (!targetUserId) {
        client.log.logAndReply(message, `Esse usuário não existe`);
        return;
    }

    const userInfo = await client.db.get('users', { userid: targetUserId });
    if (userInfo.length === 0) {
        client.log.logAndReply(message, `Nunca vi esse usuário`);
        return;
    }

    if (userInfo[0].optoutLs) {
        client.log.logAndReply(
            message,
            `Esse usuário optou por não ser alvo de comandos lastseen 🚫`
        );
        return;
    }

    const lsDate = userInfo[0].lsDate;
    const timeSinceLs = timeSince(lsDate);

    client.log.logAndReply(
        message,
        `${targetUser} foi visto pela última vez num chat há ${timeSinceLs}`
    );
};

lastSeenCommand.commandName = 'lastseen';
lastSeenCommand.aliases = ['lastseen', 'ls'];
lastSeenCommand.shortDescription = 'Mostra quando alguém foi visto em algum chat pela última vez';
lastSeenCommand.cooldown = 5000;
lastSeenCommand.whisperable = false;
lastSeenCommand.description = `Pesquise há quanto tempo um usuário foi visto pela última vez em algum canal onde o Folhinha esteja presente
Se quiser desabilitar a função de outras pessoas usarem este comando em você, use !optout lastseen`;
lastSeenCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/${lastSeenCommand.commandName}/${lastSeenCommand.commandName}.js`;

export { lastSeenCommand };
