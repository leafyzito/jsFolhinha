const { processCommand } = require("../../utils/processCommand.js");

async function getMath(expression) {
    expression = expression.replace(/,/g, '.');
    const api_url = 'http://api.mathjs.org/v4/';
    const headers = { 'Content-Type': 'application/json' };
    const payload = JSON.stringify({ expr: expression });
    const response = await fetch(api_url, { method: 'POST', headers: headers, body: payload });
    const data = await response.json();
    return data.result;
}

const mathCommand = async (client, message) => {
    message.command = 'math';
    if (!await processCommand(5000, 'channel', message, client)) return;

    if (message.messageText.split(' ').length === 1) {
        client.log.logAndReply(message, `Use o formato: ${message.commandPrefix}math <expressão matemática>`);
        return;
    }

    const mathExpression = message.messageText.split(' ').slice(1).join(' ');
    const mathResult = await getMath(mathExpression);

    const emote = await client.emotes.getEmoteFromList(message.channelName, ['nerd', 'nerdge', 'catnerd', 'dognerd', 'giganerd'], '🤓');
    client.log.logAndReply(message, `${emote} ${mathResult}`);
};

mathCommand.commandName = 'math';
mathCommand.aliases = ['math', 'maths', 'matematica', 'matemática'];
mathCommand.shortDescription = 'Faça cálculos matemáticos e conversões';
mathCommand.cooldown = 5000;
mathCommand.whisperable = true;
mathCommand.description = `Use !math {expressão matemática} para fazer cálculos matemáticos
• Exemplo: !math 2+2*4 - O bot irá responder com o resultado: 10

Pode também fazer algumas conversões, apenas em inglês, como:
• Conversão de unidades de medida: !math 10cm to inches - O bot irá responder com o resultado: 3.937007874015748
• Conversão de tempo: !math 10 hours in seconds - O bot irá responder com o resultado: 36000

Para mais informações, consulte o site oficial do Math.js: https://mathjs.org/docs/expressions/syntax.html`;
mathCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/${mathCommand.commandName}/${mathCommand.commandName}.js`;

module.exports = {
    mathCommand,
};
