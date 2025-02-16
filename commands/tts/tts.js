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

    let args = message.messageText.split(' ').slice(1);
    let voice = 'Ricardo';
    args = args.filter(arg => {
        const argLower = arg.toLowerCase();
        if (argLower.startsWith('voice:') || argLower.startsWith('voz:')) {
            voice = argLower.split(':')[1];
            return false;
        }
        return true;
    });

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

    client.log.logAndReply(message, `🤖 ${tts}`);
};

ttsCommand.commandName = 'text-to-speech';
ttsCommand.aliases = ['tts', 'text-to-speech'];
ttsCommand.shortDescription = 'Crie um TTS com algum texto';
ttsCommand.cooldown = 5000;
ttsCommand.whisperable = true;
ttsCommand.description = `Dê voz ao Folhinha e faça-o falar uma mensagem a sua escolha
• Exemplo: !tts No jardim da vida, Floresce a esperança, Entre espinhos e espinhas, A felicidade dança. - Resposta: https://f.feridinha.com/lkTCL.mp3 

Poderá alterar a voz da mensagem através do nome da voz.
• Exemplo: !tts No jardim da vida, Floresce a esperança, Entre espinhos e espinhas, A felicidade dança. voz:Brian - Resposta: https://f.feridinha.com/j4nLL.mp3

Acesse a lista de vozes disponíveis aqui: https://github.com/chrisjp/tts/blob/master/assets/js/voices.json
Um dia irá ter uma página bonitinha com as possíveis vozes`;
ttsCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/tts/tts.js`;

module.exports = {
    ttsCommand,
};
