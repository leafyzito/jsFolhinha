// TODO hypertranslate

const { processCommand } = require("../../utils/processCommand.js");
const { translate, isLanguageSupported } = require("google-translate-api-browser");
const langs = require('../translate/langs.json');

async function translateText(textToTranslate, targetLanguage) {
    const translatedText = await translate(textToTranslate, { to: targetLanguage });
    
    return { 
        fromLanguage: translatedText.from.language.iso,
        translatedText: translatedText.text,
    };
}

async function hypertranslateText(textToTranslate, numTranslations) {
    let currentText = textToTranslate;

    for (let i = 0; i < numTranslations; i++) {
        // Pick a random language except the original language (assuming it's always starting from 'en')
        const randomLangCode = Object.keys(langs)[Math.floor(Math.random() * Object.keys(langs).length)];
        console.log(randomLangCode);
        const translation = await translateText(currentText, randomLangCode);
        currentText = translation.translatedText;
    }

    // Final translation back to pt
    const finalTranslation = await translateText(currentText, 'pt');
    return finalTranslation.translatedText;
}

const hypertranslateCommand = async (client, message) => {
    message.command = 'hypertranslate';
    if (!await processCommand(5000, 'channel', message, client)) return;

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
    client.say(message.channelName, `Correndo ${numTranslations} traduções... ${emote}`);
    const hyperTranslatedText = await hypertranslateText(textToTranslate, numTranslations);

    client.log.logAndReply(message, `${hyperTranslatedText}`);
};

hypertranslateCommand.aliases = ['hypertranslate', 'htranslate', 'ht'];

module.exports = {
    hypertranslateCommand,
};