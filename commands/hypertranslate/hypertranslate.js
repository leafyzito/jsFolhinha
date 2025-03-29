const { processCommand } = require("../../utils/processCommand.js");
const { LANGUAGE_MAPPINGS } = require('../translate/langs.js');

async function translateText(targetLanguage, textToTranslate) {
    console.log('translating to: ', targetLanguage, 'text: ', textToTranslate);
    const params = new URLSearchParams({
        client: "gtx",
        dt: "t",
        ie: "UTF-8",
        oe: "UTF-8",
        sl: 'auto',
        tl: targetLanguage,
        q: textToTranslate
    });

    const response = await fetch(`https://translate.googleapis.com/translate_a/single?${params}`, {
        method: "GET",
        headers: {
            "User-Agent": "Mozilla/5.0",
            "Accept": "application/json"
        }
    });

    const data = await response.json();
    const translatedText = data[0][0][0];
    const fromLanguage = data[2];
    const toLanguage = data[3];
    const confidence = Math.round(data[6] * 100);
    return { translatedText, fromLanguage, toLanguage, confidence };
}

async function hypertranslateText(textToTranslate, numTranslations) {
    let currentText = textToTranslate;
    let listOfTranslations = [];
    let confidenceAverage = 0;

    for (let i = 0; i < numTranslations; i++) {
        const randomLangCode = Object.values(LANGUAGE_MAPPINGS)[Math.floor(Math.random() * Object.values(LANGUAGE_MAPPINGS).length)];

        // add to listOfTranslations the name of the language
        const languageName = Object.keys(LANGUAGE_MAPPINGS).find(key => LANGUAGE_MAPPINGS[key] === randomLangCode);
        listOfTranslations.push(languageName);

        const translation = await translateText(randomLangCode, currentText);
        currentText = translation.translatedText;
        confidenceAverage += translation.confidence;
    }

    // Final translation back to pt
    const finalTranslation = await translateText('pt', currentText);
    confidenceAverage += finalTranslation.confidence;
    confidenceAverage = confidenceAverage / numTranslations;
    return { translatedText: finalTranslation.translatedText, listOfTranslations, confidenceAverage };
}

const hypertranslateCommand = async (client, message) => {
    message.command = 'hypertranslate';
    if (!await processCommand(20_000, 'channel', message, client)) return;

    const args = message.messageText.split(' ');
    if (args.length < 2) {
        client.log.logAndReply(message, `Use o formato: ${message.commandPrefix}hypertranslate (<número de traduções>) <texto para traduzir>`);
        return;
    }

    // Determine if the first argument is a number
    let numTranslations = parseInt(args[1], 10);
    if (isNaN(numTranslations)) {
        numTranslations = 10; // Set default number of translations
    } else {
        // check if there is number argument and text to be translated
        if (args.length < 3) {
            client.log.logAndReply(message, `Use o formato: ${message.commandPrefix}hypertranslate <número de traduções> <texto para traduzir>`);
            return;
        }

        if (numTranslations < 2) {
            client.log.logAndReply(message, `O número de traduções deve ser pelo menos 2`);
            return;
        }
        if (numTranslations > 20) {
            client.log.logAndReply(message, `O máximo de traduções é 20`);
            return;
        }
        args.splice(1, 1); // Remove the number of translations from the args
    }

    const textToTranslate = args.slice(1).join(' ');
    const emote = await client.emotes.getEmoteFromList(message.channelName, ['pphop', 'ppcircle', 'waiting', 'ppdvd'], '🤖');
    client.log.reply(message, `Correndo ${numTranslations} traduções... ${emote}`);
    const hyperTranslatedText = await hypertranslateText(textToTranslate, numTranslations);

    client.log.logAndReply(message, `🤖 ${hyperTranslatedText.translatedText}`, `Lista de traduções: ${hyperTranslatedText.listOfTranslations.join(', ')}`);
};

hypertranslateCommand.commandName = 'hypertranslate';
hypertranslateCommand.aliases = ['hypertranslate', 'htranslate', 'ht'];
hypertranslateCommand.shortDescription = 'Traduz um texto várias vezes';
hypertranslateCommand.cooldown = 20000;
hypertranslateCommand.whisperable = false;
hypertranslateCommand.description = `Traduz o texto fornecido o número de vezes especificado para uma linguagem aleatória, sendo o valor padrão 10
• Exemplo: !hypertranslate Olá mundo - O bot vai traduzir aleatoriamente "Olá mundo" 10 vezes
• Exemplo: !hypertranslate 15 Olá mundo - O bot vai traduzir aleatoriamente "Olá mundo" 15 vezes`;
hypertranslateCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/${hypertranslateCommand.commandName}/${hypertranslateCommand.commandName}.js`;

module.exports = {
    hypertranslateCommand,
};