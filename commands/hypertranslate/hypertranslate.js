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
    let listOfTranslations = [];

    for (let i = 0; i < numTranslations; i++) {
        const randomLangCode = Object.keys(langs)[Math.floor(Math.random() * Object.keys(langs).length)];
        console.log(randomLangCode);

        // add to listOfTranslations the name of the language
        listOfTranslations.push(langs[randomLangCode]);

        const translation = await translateText(currentText, randomLangCode);
        currentText = translation.translatedText;
    }

    // Final translation back to pt
    const finalTranslation = await translateText(currentText, 'pt');
    return { translatedText: finalTranslation.translatedText, listOfTranslations };
}

const hypertranslateCommand = async (client, message) => {
    message.command = 'hypertranslate';
    if (!await processCommand(20_000, 'channel', message, client)) return;

    client.log.logAndReply(message, `Este comando foi desabilitado temporariamente por fazer o bot crashar. Um dia ele volta`);
    return;

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
    // console.log(hyperTranslatedText.listOfTranslations);
    // client.discord.log(`* Lista de traduções: ${hyperTranslatedText.listOfTranslations.join(', ')}`);

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