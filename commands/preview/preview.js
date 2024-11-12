const { processCommand } = require("../../utils/processCommand.js");
const fetch = require('node-fetch');
const FormData = require('form-data');

async function uploadToFeridinha(content) {
    const api_url = 'https://feridinha.com/upload';
    const headers = { 'token': process.env.FERIDINHA_API_KEY };

    const form = new FormData();
    form.append('file', content, 'image.jpg');

    const response = await fetch(api_url, {
        method: 'POST',
        headers: { 'token': headers.token, ...form.getHeaders() }, // Include FormData headers
        body: form
    });

    if (response.ok) { // Check if status is 200-299
        const resData = await response.json();

        if (resData.success) {
            return resData.message;
        }

        console.log(`Failed to upload to feridinha. resData: ${JSON.stringify(resData)}`);
        return null;
    } else {
        console.log(`Error: ${response.status} ${response.statusText}`);
        return null;
    }
}

async function getImage(url) {
    const response = await fetch(url);
    const imageData = await response.buffer();
    return await uploadToFeridinha(imageData);
}

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

    return await getImage(thumbPreview);
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

previewCommand.commandName = 'preview';
previewCommand.aliases = ['preview', 'prev', 'thumb', 'thumbnail'];
previewCommand.shortDescription = 'Mostra uma imagem do momento atual de uma live';
previewCommand.cooldown = 5000;
previewCommand.whisperable = false;
previewCommand.description = `Exibe uma imagem do momento atual da live do canal fornecido
• Exemplo: !preview omeiaum - Se o canal "omeiaum" estiver ao vivo, o bot vai enviar uma imagem do momento atual da live`;
previewCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/${previewCommand.commandName}/${previewCommand.commandName}.js`;

module.exports = {
    previewCommand,
};
