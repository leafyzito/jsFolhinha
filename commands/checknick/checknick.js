const { processCommand } = require("../../utils/processCommand.js");

async function checkNick(nick) {
    const api_url = `https://api.fuchsty.com/twitch/checkname?username=${nick}`;
    const response = await fetch(api_url);
    const data = await response.json();

    const isInvalid = data[0].invalid;
    if (isInvalid) {
        return 'invalid';
    }

    const isAvailable = data[0].available;
    if (isAvailable) {
        return true;
    }

    return false;

}

const checkNickCommand = async (client, message) => {
    message.command = 'checknick';
    if (!await processCommand(5000, 'channel', message, client)) return;

    if (message.messageText.split(' ').length < 2) {
        client.log.logAndReply(message, `Use o formato: ${prefix}checknick <nick>`);
        return;
    }

    const nick = message.messageText.split(' ')[1].replace(/^@/, '');

    const checkNickRes = await checkNick(nick);

    // TODO: getEmoteFromList
    if (checkNickRes === 'invalid') {
        client.log.logAndReply(message, `O nick ${nick} é inválido`);
        return;
    }

    if (!checkNickRes) {
        const emote = await client.emotes.getEmoteFromList(message.channelName, ['paia'], '👎');
        client.log.logAndReply(message, `O nick ${nick} não está disponível ${emote}`);
        return;
    }

    const emote = await client.emotes.getEmoteFromList(message.channelName, ['joia', 'jumilhao'], '👍');
    client.log.logAndReply(message, `O nick ${nick} está disponível ${emote}`);
};

checkNickCommand.commandName = 'checknick';
checkNickCommand.aliases = ['checknick', 'nickcheck', 'namecheck', 'checkname'];
checkNickCommand.shortDescription = 'Verifica se um nick específico está disponível';
checkNickCommand.cooldown = 5000;
checkNickCommand.whisperable = true;
checkNickCommand.description = 'Uso: !checknick <nick>; Resposta esperada: O nick {nick} está disponível/indisponível';
checkNickCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/${checkNickCommand.commandName}/${checkNickCommand.commandName}.js`;

module.exports = {
    checkNickCommand,
};
