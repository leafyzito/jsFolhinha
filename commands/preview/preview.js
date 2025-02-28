const { processCommand } = require("../../utils/processCommand.js");
const fetch = require('node-fetch');
const FormData = require('form-data');
const path = require('path');
const fs = require('fs');

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

async function makePreview(channelName) {
    try {
        const response = await fetch(`http://localhost:8989/preview/${channelName}`);
        const data = await response.json();

        if (!response.ok) {
            return null;
        }

        // Resolve the path to the "clips" folder inside "twitchClipper"
        const previewsFolder = path.resolve('/home/leafy/twitchClipper/previews');
        var previewPath = path.join(previewsFolder, data.path);
        console.log(previewPath);
        // upload clip to feridinha
        const previewContent = fs.readFileSync(previewPath);
        const previewUrl = await uploadToFeridinha(previewContent);

        return previewUrl;

    } catch (error) {
        console.log('Error making clip:', error);
        return null;
    }
}

async function getImage(url) {
    const response = await fetch(url);
    const imageData = await response.buffer();
    return await uploadToFeridinha(imageData);
}

async function getOfflineImage(previewTarget) {
    const api_url = `https://api.twitch.tv/helix/users?login=${previewTarget}`;
    const headers = {
        "Client-ID": process.env.BOT_CLIENT_ID,
        "Authorization": `Bearer ${process.env.BOT_OAUTH_TOKEN}`
    };
    const response = await fetch(api_url, { headers });
    const data = await response.json();

    if (data.data.length === 0) {
        return null;
    }

    const offlineImage = data.data[0].offline_image_url;
    if (!offlineImage || offlineImage === '') {
        return null;
    }

    return await getImage(offlineImage);
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

    if (data.data.length === 0) {
        // if offline, return the offline image
        const offlineImage = await getOfflineImage(previewTarget);
        return { isLive: false, image: offlineImage };
    }

    // make preview
    const preview = await makePreview(previewTarget);
    if (preview) {
        return { isLive: true, image: preview };
    }

    const thumbPreviewRaw = data.data[0].thumbnail_url;
    const thumbPreview = thumbPreviewRaw.replace("{width}x{height}", "1280x720");
    const thumbPreviewUrl = await getImage(thumbPreview);

    return { isLive: true, image: thumbPreviewUrl };
}

const previewCommand = async (client, message) => {
    message.command = 'preview';
    if (!await processCommand(5000, 'channel', message, client)) return;

    const previewTarget = message.messageText.split(' ')[1]?.replace(/^@/, '') || message.channelName;
    const preview = await getPreview(previewTarget);

    if (preview === 'não existe') {
        client.log.logAndReply(message, `O canal ${previewTarget} não existe`);
        return;
    }

    if (!preview.isLive && preview.image === null) {
        client.log.logAndReply(message, `O canal ${previewTarget} não está em live`);
        return;
    }

    if (!preview.isLive && preview.image !== null) {
        client.log.logAndReply(message, `O canal ${previewTarget} não está em live, aqui está a tela offline: ${preview.image}`);
        return;
    }

    if (preview.isLive) {
        client.log.logAndReply(message, `Preview da live de ${previewTarget}: ${preview.image}`);
    }
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
