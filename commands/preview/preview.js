const { processCommand } = require("../../utils/processCommand.js");
const { shortenUrl } = require("../../utils/utils.js");

async function getPreview(previewTarget) {
    const api_url = `https://api.twitch.tv/helix/streams?user_login=${previewTarget}`;
    const headers = {
        "Client-ID": process.env.BOT_CLIENT_ID,
        "Authorization": `Bearer ${process.env.BOT_OAUTH_TOKEN}`
    };
    // Make API request to fetch clips
    const response = await fetch(api_url, { headers });
    const data = await response.json();

    if ("error" in data) { return 'não existe'; }

    if (data.data.length === 0) { return null; }

    const thumbPreviewRaw = data.data[0].thumbnail_url;
    const thumbPreview = thumbPreviewRaw.replace("{width}x{height}", "1280x720");
    
    return await shortenUrl(thumbPreview);
}

const previewCommand = async (client, message) => {
    message.command = 'preview';
    if (!await processCommand(5000, 'channel', message, client)) return;

    const previewTarget = message.messageText.split(' ')[1]?.replace(/^@/, '') || message.channelName;
    const preview = await getPreview(previewTarget);

    if (!preview) {
        client.log.logAndReply(message, `O canal ${previewTarget} não está em live`);
        return;
    }

    if (preview === 'não existe') {
        client.log.logAndReply(message, `O canal ${previewTarget} não existe`);
        return;
    }

    client.log.logAndReply(message, `Preview da live de ${previewTarget}: ${preview}`);
};

previewCommand.aliases = ['preview', 'thumb'];

module.exports = {
    previewCommand,
};
