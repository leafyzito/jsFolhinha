import { processCommand } from '../../utils/processCommand.js';

const sugerirCommand = async (client, message) => {
    message.command = 'sugerir';
    if (!(await processCommand(5000, 'channel', message, client))) return;

    if (message.messageText.split(' ').length === 1) {
        client.log.logAndReply(
            message,
            `Use o formato: ${message.commandPrefix}sugerir <sugestão>`
        );
        return;
    }

    let sugestao = message.messageText.split(' ').slice(1).join(' ');

    const currentDate = new Date();
    const formattedDate = currentDate.toISOString().replace('T', ' ').substr(0, 19);

    await client.db.insert('sugestoes', {
        channel: message.channelName,
        user: message.senderUsername,
        sugestao: sugestao,
        date: formattedDate,
    });

    const emote = await client.emotes.getEmoteFromList(
        message.channelName,
        ['joia', 'jumilhao'],
        'FeelsOkayMan 👍'
    );
    client.log.logAndReply(
        message,
        `Obrigado pela sugestão. Assim que possível, o @${process.env.DEV_NICK} dará uma olhada ${emote}`
    );
};

sugerirCommand.commandName = 'sugerir';
sugerirCommand.aliases = ['sugerir', 'sugestao', 'sugestão'];
sugerirCommand.shortDescription = 'Envia uma sugestão para o bot';
sugerirCommand.cooldown = 5000;
sugerirCommand.whisperable = true;
sugerirCommand.description = `Deixe a sua contribuição para a caixinha de sugestões do Folhinha, poderá relatar bugs, erros, inovações...
Qualquer coisa que ache que possa melhorar a experiência com o Folhinha e suas funcionalidades`;
sugerirCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/${sugerirCommand.commandName}/${sugerirCommand.commandName}.js`;

export { sugerirCommand };
