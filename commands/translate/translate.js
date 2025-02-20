const { processCommand } = require("../../utils/processCommand.js");
const { translate, isLanguageSupported } = require("google-translate-api-browser");
const langs = require('./langs.json');

async function translateText(textToTranslate, targetLanguage) {
    const translatedText = await translate(textToTranslate, { to: targetLanguage });

    return {
        fromLanguage: translatedText.from.language.iso,
        translatedText: translatedText.text,
    };
}

const translateCommand = async (client, message) => {
    message.command = 'translate';
    if (!await processCommand(5000, 'channel', message, client)) return;

    client.log.logAndReply(message, `Este comando foi desabilitado temporariamente por fazer o bot crashar. Um dia ele volta`);
    return;

    const args = message.messageText.split(' ');
    if (args.length < 2) {
        client.log.logAndReply(message, `Use o formato: ${message.commandPrefix}translate <texto para traduzir>`);
        return;
    }

    var targetLanguage = null;
    for (const word of args.slice(1)) {
        if (word.startsWith('to:')) {
            const languageQuery = word.split(':')[1].toLowerCase();
            targetLanguage = Object.keys(langs).find(key =>
                key.toLowerCase() === languageQuery || langs[key].toLowerCase() === languageQuery
            ) || languageQuery;
            args.splice(args.indexOf(word), 1);
        }
    }

    if (!targetLanguage) {
        targetLanguage = 'pt';
    }
    if (!isLanguageSupported(targetLanguage)) {
        client.log.logAndReply(message, `O idioma "${targetLanguage}" não é válido. Tente colocar o código do idioma ou em inglês, por exemplo: "pt" ou "portuguese"`);
        return;
    }

    const textToTranslate = args.slice(1).join(' ');
    const translatedText = await translateText(textToTranslate, targetLanguage);
    const translateFrom = translatedText.fromLanguage;

    // match language to language code from json file
    const targetLanguageCode = langs[targetLanguage] || targetLanguage;
    const fromLanguageCode = langs[translateFrom] || translateFrom;

    client.log.logAndReply(message, `${fromLanguageCode} → ${targetLanguageCode}: ${translatedText.translatedText}`);
};

translateCommand.commandName = 'translate';
translateCommand.aliases = ['traducao', 'traduçao', 'tradução', 'translate', 'traduzir', 't'];
translateCommand.shortDescription = 'Traduza algum texto';
translateCommand.cooldown = 5000;
translateCommand.whisperable = true;
translateCommand.description = `Forneça um texto para o bot traduzir para português, ou, caso especificado, para outra língua
• Exemplo: !translate Hello World - O bot irá traduzir "Hello World" para o português
• Exemplo: !translate to:es Hello World - O bot irá traduzir "Hello World" para espanhol
• Exemplo: !translate to:spanish Hello World - O bot irá traduzir "Hello World" para espanhol

A língua fornecida deve ser o seu código ou o nome do idioma em inglês
Mais tarde possivelmente existirá uma página com as possibilidades de códigos dos idiomas e nomes respectivamente`;
translateCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/${translateCommand.commandName}/${translateCommand.commandName}.js`;

module.exports = {
    translateCommand,
};
