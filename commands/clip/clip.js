const { processCommand } = require("../../utils/processCommand.js");
const path = require('path');
const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');

async function uploadToFeridinha(content, clipName) {
    const api_url = 'https://feridinha.com/upload';
    const headers = { 'token': process.env.FERIDINHA_API_KEY };

    const form = new FormData();
    form.append('file', content, {
        filename: clipName,
        contentType: 'video/mp4'
    });

    try {
        const response = await fetch(api_url, {
            method: 'POST',
            headers: {
                'token': headers.token,
                ...form.getHeaders()
            },
            body: form
        });

        if (response.ok) {
            const resData = await response.json();
            if (resData.success) {
                return resData.message;
            }
            console.log(`Failed to upload to feridinha. resData: ${JSON.stringify(resData)}`);
        } else {
            console.log(`Error: ${response.status} ${response.statusText}`);
            const errorText = await response.text();
            console.log(`Error details: ${errorText}`);
        }
    } catch (error) {
        console.log('Upload error:', error);
    }
    return null;
}

async function makeClip(channelName) {
    try {
        const response = await fetch(`http://localhost:8989/clip/${channelName}`);
        const data = await response.json();

        if (!response.ok) {
            return null;
        }

        // Resolve the path to the "clips" folder inside "twitchClipper"
        const clipsFolder = path.resolve('/home/leafy/twitchClipper/clips');
        var clipPath = path.join(clipsFolder, data.path);
        console.log(clipPath);
        // upload clip to feridinha
        const clipName = path.basename(clipPath);
        const clipContent = fs.readFileSync(clipPath);
        const clipUrl = await uploadToFeridinha(clipContent, clipName);

        return clipUrl;

    } catch (error) {
        console.log('Error making clip:', error);
        return null;
    }
}

async function createTwitchClip(channelId, channelName, forceTwitchClip = false) {
    // If forceTwitchClip is false, try makeClip first
    if (!forceTwitchClip) {
        const createdClip = await makeClip(channelName);
        if (createdClip) {
            return createdClip;
        }
        // If makeClip fails, continue to try Twitch API
    }

    const api_url = `https://api.twitch.tv/helix/clips?broadcaster_id=${channelId}&has_delay=true`;
    const response = await fetch(api_url, {
        method: 'POST',
        headers: { "Client-ID": process.env.BOT_CLIENT_ID, "Authorization": `Bearer ${process.env.BOT_OAUTH_TOKEN}` }
    });

    const data = await response.json();
    if (data.status === 403 || data.status === 503) { // 403 is for forbidden, 503 is for service unavailable (error in twitch api)
        return 'error';
    };
    if (data.status === 404) { return null; };

    const clipId = data.data[0].id;
    const editUrl = data.data[0].edit_url;

    // Add a 1 second timeout, to give time for the clip to be created correctly
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
        id: clipId,
        editUrl: editUrl
    }
}


const clipCommand = async (client, message) => {
    message.command = 'clip';
    if (!await processCommand(5000, 'channel', message, client)) return;

    const targetChannel = message.messageText.split(' ')[1]?.replace(/^@/, '') || message.channelName;
    const targetId = message.channelName === targetChannel ? message.channelID : await client.getUserID(targetChannel);
    if (!targetId) {
        client.log.logAndReply(message, `Esse usuário não existe`);
        return;
    }

    // flag to force the creation of the clip using the twitch api over makeClip
    const forceTwitchClip = message.messageText.includes('-twitch');

    const clip = await createTwitchClip(targetId, targetChannel, forceTwitchClip);
    if (!clip) {
        client.log.logAndReply(message, `O canal ${targetChannel} não está em live`);
        return;
    }
    else if (clip === 'error') {
        client.log.logAndReply(message, `⚠️ Erro ao criar clip, tente novamente`);
        return;
    }
    else if (clip === 'forbidden') {
        client.log.logAndReply(message, `Esse canal não permite criar clipes`);
        return;
    }
    if (clip.id) {
        client.log.logAndReply(message, `🎬 https://clips.twitch.tv/${clip.id}`)
        return;
    }
    client.log.logAndReply(message, `🎬 ${clip}`)

};

clipCommand.commandName = 'clip';
clipCommand.aliases = ['clip', 'clipe'];
clipCommand.shortDescription = 'Crie um clip de alguma live';
clipCommand.cooldown = 5000;
clipCommand.whisperable = false;
clipCommand.description = `Crie um clip de alguma live. Se nenhum canal for especificado, o comando irá criar um clip do canal onde o comando foi executado
• Exemplo: !clip - O bot vai criar um clip do canal onde o comando foi executado
• Exemplo: !clip @leafyzito - O bot vai criar um clip do canal do usuário @leafyzito, caso ele esteja em live
• Exemplo: !clip @leafyzito -twitch - O bot vai criar um clip do canal do usuário @leafyzito, caso ele esteja em live, usando a api do twitch ao invés de upar o clip para o feridinha`;
clipCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/${clipCommand.commandName}/${clipCommand.commandName}.js`;

module.exports = {
    clipCommand,
};
