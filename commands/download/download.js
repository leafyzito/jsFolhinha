const { processCommand } = require("../../utils/processCommand.js");
const { shortenUrl } = require("../../utils/utils.js");

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
        resUrl = await shortenUrl(resUrl);
        return resUrl;
    } catch (e) {
        console.log(`erro no getVideoDownload: ${e}`);
        console.log(`resData: ${resData}`);
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

async function getAudioDownload(urlToDownload) {
    const apiUrl = 'https://co.wuk.sh/api/json';
    const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    };
    const data = {
        'url': urlToDownload,
        'isAudioOnly': true
    };

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(data)
        });
        const resData = await response.json();
        let resUrl = resData.url;
        resUrl = await shortenUrl(resUrl);
        return resUrl;
    } catch (e) {
        console.log(`erro no getAudioDownload: ${e}`);
        console.log(`resData: ${resData}`);
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
Para mais informações sobre a API utilizada, acesse https://github.com/imputnet/cobalt`;
downloadCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/${downloadCommand.commandName}/${downloadCommand.commandName}.js`;

module.exports = {
    downloadCommand,
};
