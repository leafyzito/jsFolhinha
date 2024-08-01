const { manageCooldown } = require("../../utils/manageCooldown.js");
const { logAndReply } = require("../../utils/log.js");
const { shortenUrl } = require("../../utils/utils.js");

async function getVideoDownload(urlToDownload) {
    const apiUrl = 'https://co.wuk.sh/api/json'; // https://cobalt.tools/
    const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    };
    const data = {
        'url': urlToDownload
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
    if (!manageCooldown(5000, 'channel', message.senderUsername, message.command)) return;

    const args = message.messageText.split(' ');
    if (args.length < 2) {
        logAndReply(client, message, `Use o formato ${message.commandPrefix}download (opcional: video/audio) <link para fazer download>`);
        return;
    }

    if ((args.length === 2 || args[1].toLowerCase() === 'video') && args[1].toLowerCase() !== 'audio') {
        const urlToDownload = args[2] ? args[2] : args[1];
        if (urlToDownload === 'video' || urlToDownload === 'audio') {
            logAndReply(client, message, `Use o formato ${message.commandPrefix}download video <link para fazer download>`);
            return;
        }

        let downloadUrl = await getVideoDownload(urlToDownload);
        if (downloadUrl === 'apiError') {
            logAndReply(client, message, `Não foi possível fazer o download, o serviço para esse site não está funcionando no momento. Tente novamente mais tarde`);
            return;
        } else if (!downloadUrl) {
            logAndReply(client, message, `Não foi possível fazer o download desse link`);
            return;
        }
        logAndReply(client, message, `Link do download: ${downloadUrl}`);
        return;
    }

    if (args[1].toLowerCase() === 'audio') {
        const urlToDownload = args[2];
        if (!urlToDownload) {
            logAndReply(client, message, `Use o formato ${message.commandPrefix}download audio <link para fazer download>`);
            return;
        }

        let downloadUrl = await getAudioDownload(urlToDownload);
        if (downloadUrl === 'apiError') {
            logAndReply(client, message, `Não foi possível fazer o download, o serviço para esse site não está funcionando no momento. Tente novamente mais tarde`);
            return;
        } else if (!downloadUrl) {
            logAndReply(client, message, `Não foi possível fazer o download desse link`);
            return;
        }
        logAndReply(client, message, `Link do download de audio: ${downloadUrl}`);
        return;
    }

    logAndReply(client, message, `Use o formato ${message.commandPrefix}download (opcional: video/audio) <link para fazer download>`);
};


module.exports = {
    downloadCommand: downloadCommand,
    downloadAliases: ['download', 'dl']
};
