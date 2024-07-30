const { manageCooldown } = require("../../utils/manageCooldown.js");
const { logAndReply } = require("../../utils/log.js");

async function getColor(userId) {
    const api_url = `https://api.twitch.tv/helix/chat/color?user_id=${userId}`;
    const headers = { "Client-ID": process.env.BOT_CLIENT_ID, "Authorization": `Bearer ${process.env.BOT_OAUTH_TOKEN}` };
    // Make API request to fetch color
    const response = await fetch(api_url, { headers });
    const data = await response.json();

    return data.data[0].color;
}

async function getColorName(hexCode) {
    hexCode = hexCode.replace("#", "");
    const api_url = `https://www.thecolorapi.com/id?hex=${hexCode}`;

    const response = await fetch(api_url);
    const data = await response.json();

    return data.name.value;
}

const corCommand = async (client, message) => {
    message.command = 'cor';
    if (!manageCooldown(5000, 'channel', message.senderUsername, message.command)) return;

    const colorTarget = message.messageText.split(' ')[1]?.replace(/^@/, '') || message.senderUserID;
    const colorTargetID = (colorTarget !== message.senderUserID) ? await client.getUserID(colorTarget) : message.senderUserID;

    if (!colorTargetID) {
        logAndReply(client, message, `O usuário ${colorTarget} não existe`);
        return;
    }

    const color = await getColor(colorTargetID);
    if (!color) {
        logAndReply(client, message, `${colorTarget} não tem uma cor definida`);
        return;
    }

    const colorName = await getColorName(color);

    logAndReply(client, message, 
        `${colorTarget == message.senderUserID ? `A sua cor é: ${color} - ${colorName}` : `A cor de ${colorTarget} é: ${color} - ${colorName}`}`);
};


module.exports = { corCommand: corCommand};
