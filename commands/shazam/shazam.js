const { processCommand } = require("../../utils/processCommand.js");
const { Shazam } = require("node-shazam");
const shazam = new Shazam();
const FormData = require('form-data');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');


const isDirectFileUrl = (url) => {
    const directFileExtensions = ['.mp4', '.mp3', '.wav', '.ogg', '.webm', '.m4a', '.aac'];
    return directFileExtensions.some(ext => url.toLowerCase().includes(ext));
};

async function uploadToFeridinha(content, fileName) {
    const api_url = 'https://feridinha.com/upload';
    const headers = { 'token': process.env.FERIDINHA_API_KEY };

    const form = new FormData();
    form.append('file', content, {
        filename: fileName,
        contentType: 'audio/mpeg'
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

async function getVideoCobalt(urlToDownload) {
    const apiUrl = 'http://localhost:9000/'; // https://cobalt.tools/ local instance
    const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': 'ApiKey ' + process.env.COBALT_API_KEY
    };
    const payload = {
        'url': urlToDownload,
        'downloadMode': 'audio'
    };

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload)
        });
        const resData = await response.json();
        let resUrl = resData.url;

        // Download the audio content
        const audioResponse = await fetch(resUrl);
        const audioContent = await audioResponse.buffer();

        // Upload to feridinha
        const fileName = `audio_${Date.now()}.mp3`;
        const feridinhaUrl = await uploadToFeridinha(audioContent, fileName);

        if (!feridinhaUrl) {
            console.log('Failed to upload to feridinha, falling back to original URL');
            return resUrl;
        }

        return feridinhaUrl;
    } catch (e) {
        console.log(`erro no getVideoDownload: ${e}`);
        try {
            const errorText = resData.text;
            if ('connect to the service api' in errorText) {
                return 'apiError';
            } else {
                return null;
            }
        } catch (e2) {
            console.log(`erro no try-catch do getVideoDownload: ${e2}`);
            return null;
        }
    }
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
        // console.log(clipPath);
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

async function shazamIt(url) {
    try {
        // If it's not a direct file URL, download and upload to feridinha first
        if (!isDirectFileUrl(url)) {
            console.log('URL is not a direct file URL, getting video download...');
            url = await getVideoCobalt(url);
            if (!url) { return 'cobalt-error'; } // if it's not a direct file URL, and the getVideoCobalt fails, return null
        }

        console.log(`Downloading audio content from ${url}...`);
        // Download the audio content
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        console.log('Audio content downloaded, saving to buffer...');
        // Save the buffer to a temporary file
        const tempFile = path.join(__dirname, `temp_audio_${Date.now()}.mp3`);
        fs.writeFileSync(tempFile, buffer);

        console.log(tempFile);
        console.log('Using Shazam to recognize audio...');
        // Use the file path with Shazam
        const recognition = await shazam.recognise(tempFile, 'en-US');
        // console.log(recognition);

        // Clean up the temporary file
        fs.unlinkSync(tempFile);

        return recognition;
    } catch (error) {
        console.error('Error in shazamIt:', error);
        return null;
    }
}

const shazamCommand = async (client, message) => {
    message.command = 'shazam';
    if (!await processCommand(10_000, 'channel', message, client)) return;

    const args = message.messageText.split(' ');
    if (args.length < 2) {
        client.log.logAndReply(message, `Use o formato: ${message.commandPrefix}shazam <link>. Se estiver com dúvidas sobre o comando, acesse https://folhinhabot.com/comandos/shazam 😁`);
        return;
    }

    let urlToShazam = args[1];

    // Validate if it's a URL
    const urlPattern = /^(https?:\/\/)?(www\.)?([\da-z.-]+)\.([a-z.]{2,})([/\w .-?=&]*)*\/?$/;
    if (!urlPattern.test(urlToShazam)) {
        client.log.logAndReply(message, `Por favor, forneça um link válido. Use o formato: ${message.commandPrefix}shazam <link>. Se estiver com dúvidas sobre o comando, acesse https://folhinhabot.com/comandos/shazam 😁`);
        return;
    }

    // Check if it's a Twitch channel URL or a clip URL
    const twitchChannelMatch = urlToShazam.match(/twitch\.tv\/([^\/\?]+)(?:\?|$)/);
    const twitchClipMatch = urlToShazam.match(/twitch\.tv\/[^\/]+\/clip\//);

    if (twitchChannelMatch && !twitchClipMatch) {
        const channelName = twitchChannelMatch[1];
        console.log(`Detected Twitch channel: ${channelName}, creating clip...`);

        // Create clip
        const clip = await makeClip(channelName);
        if (!clip) {
            console.log(`Não deu pra criar clip com o makeClip`);
            client.log.logAndReply(message, `Não consegui criar um clip para identificar a música, tente novamente. Se o problema persistir, avise o dev`);
            return;
        }
        else if (clip === 'error') {
            throw new Error(`Shazam makeClip - Check logs`);
            return;
        }
        urlToShazam = clip;
    }

    const result = await shazamIt(urlToShazam);
    if (!result) {
        // throw new Error(`Shazam shazamIt - Check logs`);
        client.log.logAndReply(message, `Não consegui identificar a música desse link`);
        return;
    }

    if (result === 'cobalt-error') {
        throw new Error(`Shazam shazamIt cobalt-error - Check logs`);
        return;
    }

    if (result.track) {
        const track = result.track;
        client.log.logAndReply(message, `🎵 Música identificada: ${track.title} - ${track.subtitle} (${track.url})`);
        return;
    }

    client.log.logAndReply(message, `Não consegui identificar a música desse link`);
    return;
};

shazamCommand.commandName = 'shazam';
shazamCommand.aliases = ['shazam'];
shazamCommand.shortDescription = 'Identifica músicas através do Shazam';
shazamCommand.cooldown = 10_000;
shazamCommand.whisperable = true;
shazamCommand.description = `Este comando pode estar um pouco instável. Qualquer problema, por favor avise o dev

Identifica músicas de algum link fornecido ou de uma live da Twitch:
• Exemplo: !shazam https://x.com/billieeilishtrs/status/1839682299673096667 - O bot vai fazer o download do vídeo e depois identificar a música (peguei um video aleatório do twitter não me julga)
• Exemplo: !shazam https://f.feridinha.com/okjxM.mp4 - O bot vai identificar a música do vídeo fornecido
• Exemplo: !shazam www.twitch.tv/xql - O bot vai criar um clip e depois identificar a música do clip`;
shazamCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/${shazamCommand.commandName}/${shazamCommand.commandName}.js`;

module.exports = {
    shazamCommand,
};
