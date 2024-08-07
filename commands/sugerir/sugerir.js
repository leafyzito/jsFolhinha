const { processCommand } = require("../../utils/processCommand.js");

const sugerirCommand = async (client, message) => {
    message.command = 'sugerir';
    if (!await processCommand(5000, 'channel', message, client)) return;

    if (message.messageText.split(' ').length === 1) {
        client.log.logAndReply(message, `Use o formato: ${message.commandPrefix}sugerir <sugestão>`);
        return;
    }

    var sugestao = message.messageText.split(' ').slice(1).join(' ');
    
    const currentDate = new Date();
    const formattedDate = currentDate.toISOString().replace('T', ' ').substr(0, 19);

    await client.db.insert('sugestoes', {
        'channel': message.channelName,
        'user': message.senderUsername,
        'sugestao': sugestao,
        'date': formattedDate
    });

    client.log.logAndReply(message, `Obrigado pela sugestão 👍`);
};

sugerirCommand.aliases = ['sugerir', 'sugestao', 'sugestão'];

module.exports = {
    sugerirCommand,
};
