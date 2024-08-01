const { OpenAI } = require('openai');
const { manageCooldown } = require("../../utils/manageCooldown.js");

const gptClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const gptCommand = async (client, message) => {
    message.command = 'gpt';
    if (!manageCooldown(5000, 'channel', message.senderUsername, message.command)) return;

    const prompt = message.messageText.split(' ').slice(1).join(' ');

    if (!prompt) {
        client.log.logAndReply(message, 'Use o formato: !gpt <qualquer coisa>');
        return;
    }

    const completion = await gptClient.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
            { role: 'system', content: 'You are a helpful assistant.' },
            { role: 'user', content: prompt }
        ],
    });

};


module.exports = {
    gptCommand,
    gptAliases: ['gpt']
};
