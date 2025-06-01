import { processCommand } from '../../utils/processCommand.js';

async function getQuery(expression) {
    const urlEncodedExpression = encodeURIComponent(expression);
    const api_url = `http://api.wolframalpha.com/v1/result?appid=${process.env.WOLFRAM_API_KEY}&i=${urlEncodedExpression}&units=metric`;
    const response = await fetch(api_url);
    const data = await response.text();

    return data;
}

const queryCommand = async (client, message) => {
    message.command = 'query';
    if (!(await processCommand(5000, 'channel', message, client))) return;

    if (message.messageText.split(' ').length === 1) {
        client.log.logAndReply(
            message,
            `Use o formato: ${message.commandPrefix}query <expressão matemática>. Para mais informações, acesse https://folhinhabot.com/comandos/query`
        );
        return;
    }

    const query = message.messageText.split(' ').slice(1).join(' ');
    const queryResult = await getQuery(query);

    const emote = await client.emotes.getEmoteFromList(
        message.channelName,
        ['nerd', 'nerdge', 'catnerd', 'dognerd', 'giganerd'],
        '🤓'
    );
    client.log.logAndReply(message, `${emote} ${queryResult}`);
};

queryCommand.commandName = 'query';
queryCommand.aliases = ['query', 'q', 'math', 'maths', 'matematica', 'matemática'];
queryCommand.shortDescription = 'Faça cálculos matemáticos e conversões';
queryCommand.cooldown = 5000;
queryCommand.whisperable = true;
queryCommand.description = `Use !query {expressão matemática} para fazer cálculos matemáticos
• Exemplo: !query 2+2*4 - O bot irá responder com o resultado: 10

Pode também fazer algumas conversões, apenas em inglês, como:
• Conversão de unidades de medida: !query 10cm to inches - O bot irá responder com o resultado: 3.937007874015748
• Conversão de tempo: !query 10 hours in seconds - O bot irá responder com o resultado: 36000
• Hora em algum lugar do mundo: !query time in são paulo - O bot irá responder com o horário atual de São Paulo
• Conversão de moedas: !query 10 USD to BRL - O bot irá responder com o resultado: 55.00
• Conversão de temperatura: !query 100F to C - O bot irá responder com o resultado: 37.78
• Distância entre dois pontos: !query distance between portugal and brazil - O bot irá responder com o resultado: 7318 km (kilometers)

Para mais informações, consulte o site oficial do <a href="https://products.wolframalpha.com/short-answers-api/explorer/" target="_blank" style="color: #67e8f9">Wolfram Alpha</a>`;
queryCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/${queryCommand.commandName}/${queryCommand.commandName}.js`;

export { queryCommand };
