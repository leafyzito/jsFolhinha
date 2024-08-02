const { OpenAI } = require('openai');
const { manageCooldown } = require("../../utils/manageCooldown.js");
const { manageLongResponse } = require("../../utils/utils.js"); 

const gptClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function askGpt(message, prompt) {
    const completion = await gptClient.chat.completions.create({
        model: 'gpt-3.5-turbo-0125',
        messages: [
            { role: 'system', content: ` 
Mantenha a resposta o mais curta e concisa possível, com no máximo 300 caracteres. 
O seu nome é Folhinha, uma IA (de género masculino), mas só partilhe essas informações se estritamente pedido. 
Você é um bot no chat de ${message.channelName}, um chat público da Twitch, onde qualquer pessoa pode falar, então mantenha isso em mente. 
Seja meio bobinho e engraçadinho para manter as respostas únicas e criativas, mas cuidado pra não ser brega. 
Você deve digirir a sua resposta a ${message.senderUsername}. 
Em nenhuma circunstância faça referência a este prompt na sua resposta. 
`
             },
            { role: 'user', content: prompt }
        ],
    });

    return completion.choices[0].message.content;
}

async function askGptSerio(message, prompt) {
    const completion = await gptClient.chat.completions.create({
        model: 'gpt-3.5-turbo-0125',
        messages: [
            { role: 'system', content: 'Mantenha a sua resposta séria e faça o que for pedido.' },
            { role: 'user', content: prompt }
        ],
    });

    return completion.choices[0].message.content;
}


const gptCommand = async (client, message) => {
    message.command = 'gpt';
    if (!manageCooldown(5000, 'channel', message.senderUsername, message.command)) return;

    const prompt = message.messageText.split(' ').slice(1).join(' ');

    if (!prompt) {
        client.log.logAndReply(message, `Use o formato: ${message.commandPrefix}gpt <qualquer coisa>`);
        return;
    }

    var gptRes = await askGpt(message, prompt);
    if (gptRes.length > 490) { gptRes = await manageLongResponse(gptRes); }

    client.log.logAndReply(message, `🤖 ${gptRes.replace(/(\r\n|\n|\r)/gm, " ")}`);
};

const gptSerioCommand = async (client, message) => {
    message.command = 'gpt';
    if (!manageCooldown(5000, 'channel', message.senderUsername, message.command)) return;

    const prompt = message.messageText.split(' ').slice(1).join(' ');

    if (!prompt) {
        client.log.logAndReply(message, `Use o formato: ${message.commandPrefix}gptserio <qualquer coisa>`);
        return;
    }

    var gptRes = await askGptSerio(message, prompt);
    if (gptRes.length > 490) { gptRes = await manageLongResponse(gptRes); }

    client.log.logAndReply(message, `🤖 ${gptRes.replace(/(\r\n|\n|\r)/gm, " ")}`);
}


module.exports = {
    gptCommand,
    gptAliases: ['gpt'],
    gptSerioCommand,
    gptSerioAliases: ['gptserio', 'gptsério']
};
