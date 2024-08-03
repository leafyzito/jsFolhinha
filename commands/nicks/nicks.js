const { processCommand } = require("../../utils/processCommand.js");

const nicksCommand = async (client, message) => {
    message.command = 'nicks';
    if (!await processCommand(5000, 'channel', message, client)) return;

    const nicksTarget = message.messageText.split(' ')[1]?.replace(/^@/, '').toLowerCase() || message.senderUsername;
    const userAliases = await client.db.get('users', { aliases: nicksTarget });

    if (userAliases.length === 0) {
        client.log.logAndReply(message, `Nunca vi esse usuário`);
        return;
    }

    const aliases = userAliases[0].aliases.join(' → ');
    client.log.logAndReply(message,
        `${nicksTarget === message.senderUsername ? `O seu histórico de nicks é:`
            : `O histórico de nicks de ${nicksTarget} é:`} ${aliases}`);
};


module.exports = {
    nicksCommand: nicksCommand,
    nicksAliases: ['nick', 'nicks', 'nicknames']
};
