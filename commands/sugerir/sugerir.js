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

    const emote = await client.emotes.getEmoteFromList(message.channelName, ['joia', 'jumilhao'], '👍');
    client.log.logAndReply(message, `Obrigado pela sugestão ${emote}`);
};

sugerirCommand.commandName = 'sugerir';
sugerirCommand.aliases = ['sugerir', 'sugestao', 'sugestão'];
sugerirCommand.shortDescription = 'Envia uma sugestão para o bot';
sugerirCommand.cooldown = 5000;
sugerirCommand.whisperable = true;
sugerirCommand.description = 'Uso: !sugerir <sugestão>; Resposta esperada: Obrigado pela sugestão 👍';
sugerirCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/${sugerirCommand.commandName}/${sugerirCommand.commandName}.js`;

module.exports = {
    sugerirCommand,
};
