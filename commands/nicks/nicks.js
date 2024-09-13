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

nicksCommand.commandName = 'nicks';
nicksCommand.aliases = ['nick', 'nicks', 'nicknames'];
nicksCommand.shortDescription = 'Mostra o histórico de nicks de algum usuário';
nicksCommand.cooldown = 5000;
nicksCommand.whisperable = false;
nicksCommand.description = `Exibe o histórico de nicks de um usuário ou de quem executou o comando caso nenhum usuário seja fornecido
• Exemplo: !nicks @leafyzito - O bot irá responder com o histórico de nicks de leafyzito`;
nicksCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/${nicksCommand.commandName}/${nicksCommand.commandName}.js`;

module.exports = {
    nicksCommand,
};
