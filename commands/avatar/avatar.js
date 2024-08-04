const { processCommand } = require("../../utils/processCommand.js");
const { shortenUrl } = require("../../utils/utils.js");

async function getAvatar(avatarTarget) {
    const api_url = `https://api.ivr.fi/v2/twitch/user?login=${avatarTarget}`;
    const response = await fetch(api_url);
    const data = await response.json();

    if (data.length === 0) { return null; }

    return shortenUrl(data[0]["logo"]);
}

const avatarCommand = async (client, message) => {
    message.command = 'avatar';
    if (!await processCommand(5000, 'channel', message, client)) return;

    const avatarTarget = message.messageText.split(' ')[1]?.replace(/^@/, '') || message.senderUsername;
    const avatar = await getAvatar(avatarTarget);

    if (!avatar) {
        client.log.logAndReply(message, `O usuário ${avatarTarget} não existe`);
        return;
    }

    client.log.logAndReply(message,
        `${avatarTarget == message.senderUsername ? `O seu avatar é: ${avatar}` : `O avatar de ${avatarTarget} é: ${avatar}`}`);

};

avatarCommand.aliases = ['avatar', 'pfp'];

module.exports = {
    avatarCommand,
};
