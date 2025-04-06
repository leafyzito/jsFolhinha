const { processCommand } = require("../../utils/processCommand.js");
const { shortenUrl } = require("../../utils/utils.js");
const FormData = require('form-data');
const fetch = require('node-fetch');

async function uploadToFeridinha(content, fileName) {
    const api_url = 'https://feridinha.com/upload';
    const headers = { 'token': process.env.FERIDINHA_API_KEY };

    const form = new FormData();
    form.append('file', content, {
        filename: fileName,
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

async function getVideoDownload(urlToDownload) {
    const apiUrl = 'http://localhost:9000/'; // https://cobalt.tools/ local instance
    const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': 'ApiKey ' + process.env.COBALT_API_KEY
    };
    const payload = {
        'url': urlToDownload
    };

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload)
        });
        const resData = await response.json();
        let resUrl = resData.url;

        // Download the video content
        const videoResponse = await fetch(resUrl);
        const videoContent = await videoResponse.buffer();

        // Upload to feridinha
        const fileName = `video_${Date.now()}.mp4`;
        const feridinhaUrl = await uploadToFeridinha(videoContent, fileName);

        if (!feridinhaUrl) {
            console.log('Failed to upload to feridinha, falling back to original URL');
            return await shortenUrl(resUrl);
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
            console.log(resData);
            return null;
        }
    }
}

async function getAudioDownload(urlToDownload) {
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
            return await shortenUrl(resUrl);
        }

        return feridinhaUrl;
    } catch (e) {
        console.log(`erro no getAudioDownload: ${e}`);
        try {
            const errorText = resData.text;
            if ('connect to the service api' in errorText) {
                return 'apiError';
            } else {
                return null;
            }
        } catch (e2) {
            console.log(`erro no try-catch do getAudioDownload: ${e2}`);
            console.log(resData);
            return null;
        }
    }
}

const downloadCommand = async (client, message) => {
    message.command = 'download';
    if (!await processCommand(5000, 'channel', message, client)) return;

    const args = message.messageText.split(' ');
    if (args.length < 2) {
        client.log.logAndReply(message, `Use o formato: ${message.commandPrefix}download (opcional: video/audio) <link para fazer download>`);
        return;
    }

    if ((args.length === 2 || args[1].toLowerCase() === 'video') && args[1].toLowerCase() !== 'audio') {
        const urlToDownload = args[2] ? args[2] : args[1];
        if (urlToDownload === 'video' || urlToDownload === 'audio') {
            client.log.logAndReply(message, `Use o formato: ${message.commandPrefix}download video <link para fazer download>`);
            return;
        }

        let downloadUrl = await getVideoDownload(urlToDownload);
        if (downloadUrl === 'apiError') {
            client.log.logAndReply(message, `Não foi possível fazer o download, o serviço para esse site não está funcionando no momento. Tente novamente mais tarde`);
            return;
        } else if (!downloadUrl) {
            client.log.logAndReply(message, `Não foi possível fazer o download desse link`);
            return;
        }
        client.log.logAndReply(message, `Link do download: ${downloadUrl}`);
        return;
    }

    if (args[1].toLowerCase() === 'audio') {
        const urlToDownload = args[2];
        if (!urlToDownload) {
            client.log.logAndReply(message, `Use o formato: ${message.commandPrefix}download audio <link para fazer download>`);
            return;
        }

        let downloadUrl = await getAudioDownload(urlToDownload);
        if (downloadUrl === 'apiError') {
            client.log.logAndReply(message, `Não foi possível fazer o download, o serviço para esse site não está funcionando no momento. Tente novamente mais tarde`);
            return;
        } else if (!downloadUrl) {
            client.log.logAndReply(message, `Não foi possível fazer o download desse link`);
            return;
        }
        client.log.logAndReply(message, `Link do download de audio: ${downloadUrl}`);
        return;
    }

    client.log.logAndReply(message, `Use o formato: ${message.commandPrefix}download (opcional: video/audio) <link para fazer download>`);
};

downloadCommand.commandName = 'download';
downloadCommand.aliases = ['download', 'dl'];
downloadCommand.shortDescription = 'Faz o download de algum vídeo/audio';
downloadCommand.cooldown = 5000;
downloadCommand.whisperable = true;
downloadCommand.description = `Faça o download de mídias através do bot
• Exemplo: !download https://www.youtube.com/watch?v=dQw4w9WgXcQ

Pode também fazer download apenas do audio (mp3), utilizando o formato !download audio {link}
• Exemplo: !download audio https://www.youtube.com/watch?v=dQw4w9WgXcQ

Sites mais famosos suportados: Youtube, Instagram, Facebook, Reddit, Tiktok, Twitter, clipes da Twitch
Para mais informações sobre a API utilizada, acesse <a href="https://github.com/imputnet/cobalt/tree/main/api#supported-services" target="_blank" style="color: #67e8f9">aqui</a>`;
downloadCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/${downloadCommand.commandName}/${downloadCommand.commandName}.js`;

module.exports = {
    downloadCommand,
};
