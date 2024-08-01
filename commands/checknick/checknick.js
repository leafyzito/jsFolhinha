const { manageCooldown } = require("../../utils/manageCooldown.js");
const { logAndReply } = require("../../utils/log.js");

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
    if (!manageCooldown(5000, 'channel', message.senderUsername, message.command)) return;

    if (message.messageText.split(' ').length < 2) {
        logAndReply(client, message, `Use o formato: ${prefix}checknick <nick>`);
        return;
    }

    const nick = message.messageText.split(' ')[1].replace(/^@/, '');

    const checkNickRes = await checkNick(nick);

    // TODO: getEmoteFromList
    if (checkNickRes === 'invalid') {
        logAndReply(client, message, `O nick ${nick} é inválido`);
        return;
    }

    if (!checkNickRes) {
        logAndReply(client, message, `O nick ${nick} não está disponível 👎`);
        return;
    }

    logAndReply(client, message, `O nick ${nick} está disponível 👍`);
};


module.exports = {
    checkNickCommand: checkNickCommand,
    checkNickAliases: ['checknick', 'nickcheck', 'namecheck', 'checkname']
};
