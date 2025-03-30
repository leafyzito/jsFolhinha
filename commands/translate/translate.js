const { processCommand } = require("../../utils/processCommand.js");
const { capitalize } = require("../../utils/utils.js");
const { LANGUAGE_MAPPINGS } = require('./langs.js');

async function translateText(targetLanguage, textToTranslate) {
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

function isLanguageSupported(language) {
    // Handle direct language codes (e.g. "pt")
    if (Object.values(LANGUAGE_MAPPINGS).includes(language)) {
        return true;
    }
    // Handle language names (e.g. "portuguese")
    return LANGUAGE_MAPPINGS[language.toLowerCase()] !== undefined;
}

const translateCommand = async (client, message) => {
    message.command = 'translate';
    if (!await processCommand(5000, 'channel', message, client)) return;

    // client.log.logAndReply(message, `Este comando foi desabilitado temporariamente por fazer o bot crashar. Um dia ele volta`);
    // return;

    const args = message.messageText.split(' ');
    if (args.length < 2) {
        client.log.logAndReply(message, `Use o formato: ${message.commandPrefix}translate <texto para traduzir>`);
        return;
    }

    var targetLanguage = null;
    for (const word of args.slice(1)) {
        if (word.startsWith('to:')) {
            const languageQuery = word.split(':')[1].toLowerCase();
            targetLanguage = Object.keys(LANGUAGE_MAPPINGS).find(key =>
                key.toLowerCase() === languageQuery || LANGUAGE_MAPPINGS[key].toLowerCase() === languageQuery
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
    const translatedText = await translateText(targetLanguage, textToTranslate);
    const translateFrom = translatedText.fromLanguage;

    // match language to language code from json file
    const fromLanguageFullname = Object.keys(LANGUAGE_MAPPINGS).find(key =>
        LANGUAGE_MAPPINGS[key].toLowerCase() === translateFrom.toLowerCase()
    ) || translateFrom;
    const targetLanguageFullname = Object.keys(LANGUAGE_MAPPINGS).find(key =>
        LANGUAGE_MAPPINGS[key].toLowerCase() === targetLanguage.toLowerCase()
    ) || targetLanguage;

    client.log.logAndReply(message, `${capitalize(fromLanguageFullname)} → ${capitalize(targetLanguageFullname)}${translatedText.confidence != 100 ? ` (${translatedText.confidence}%)` : ''}: ${translatedText.translatedText}`);
};

translateCommand.commandName = 'translate';
translateCommand.aliases = ['traducao', 'traduçao', 'tradução', 'translate', 'traduzir', 't'];
translateCommand.shortDescription = 'Traduza algum texto';
translateCommand.cooldown = 5000;
translateCommand.whisperable = true;
translateCommand.langCodes = Object.entries(LANGUAGE_MAPPINGS).map(([language, code]) => ({
    language,
    code
}));
translateCommand.description = `Forneça um texto para o bot traduzir para português, ou, caso especificado, para outra língua
• Exemplo: !translate Hello World - O bot irá traduzir "Hello World" para português
• Exemplo: !translate to:es Hello World - O bot irá traduzir "Hello World" para espanhol
• Exemplo: !translate to:spanish Hello World - O bot irá traduzir "Hello World" para espanhol

A percentagem na resposta do bot é a confiança da tradução, ou seja, a probabilidade de a tradução estar correta

A língua fornecida deve ser o seu código ou o nome do idioma em inglês
Pode ver uma lista de idiomas suportados <a href="https://folhinhabot.com/linguagens" style="color: #67e8f9">aqui</a>`;
translateCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/${translateCommand.commandName}/${translateCommand.commandName}.js`;

module.exports = {
    translateCommand,
};
