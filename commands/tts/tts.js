const { processCommand } = require("../../utils/processCommand.js");
const fetch = require('node-fetch');
const FormData = require('form-data');

async function uploadToFeridinha(audio_content) {
    const api_url = 'https://feridinha.com/upload';
    const headers = { 'token': process.env.FERIDINHA_API_KEY };

    const form = new FormData();
    form.append('file', audio_content, 'output.mp3');

    const response = await fetch(api_url, {
        method: 'POST',
        headers: headers,
        body: form
    });

    if (response.status === 200) {
        const resData = await response.json();

        if (resData.success) {
            return resData.message;
        }

        console.log(`Failed to upload to feridinha. resData: ${JSON.stringify(resData)}`);
        return null;
    }
}

async function getTts(voice, text) {
    const url = `https://api.streamelements.com/kappa/v2/speech?voice=${voice}&text=${encodeURIComponent(text)}`;
    const response = await fetch(url);
    return await uploadToFeridinha(response.body);
}

const ttsCommand = async (client, message) => {
    message.command = 'tts';
    if (!await processCommand(5000, 'channel', message, client)) return;

    if (message.messageText.split(' ').length === 1) {
        client.log.logAndReply(message, `Use o formato: ${message.commandPrefix}tts <texto>`);
        return;
    }

    const args = message.messageText.split(' ').slice(1);
    var voice = args[0].startsWith('voice:') || args[0].startsWith('voz:') ? args.shift().split(':')[1].toLowerCase() : 'Ricardo';

    var msgContent = args.join(' ');

    if (!voice || !msgContent) {
        client.log.logAndReply(message, `Use o formato: ${message.commandPrefix}tts voice:Brian <texto>`);
        return;
    }

    const tts = await getTts(voice.charAt(0).toUpperCase() + voice.slice(1), msgContent);
    if (!tts) {
        client.log.logAndReply(message, `Erro ao gerar TTS`);
        return;
    }

    client.log.logAndReply(message, tts);
};

ttsCommand.aliases = ['tts'];

module.exports = {
    ttsCommand,
};
