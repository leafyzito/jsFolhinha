const { processCommand } = require("../../utils/processCommand.js");
const { randomChoice } = require("../../utils/utils.js");
const fs = require('fs');

const Piadas = fs.readFileSync('./commands/piada/piadas.txt', 'utf8');

const piadaCommand = async (client, message) => {
    message.command = 'piada';
    if (!await processCommand(5000, 'channel', message, client)) return;

    const totalJokes = Piadas.split('\n').length - 1;
    const specificPiadaIndex = message.messageText.split(' ')[1] ? parseInt(message.messageText.split(' ')[1]) : null;
    let piadaRes = specificPiadaIndex ? Piadas.split('\n')[specificPiadaIndex - 1] : randomChoice(Piadas.split('\n'));

    if (specificPiadaIndex) {
        if (specificPiadaIndex < 1 || specificPiadaIndex > totalJokes) {
            piadaRes = `Escolha um número entre 1 e ${totalJokes} para escolher uma piada específica`;
        }
    }

    // remove \n and \r from copypastaRes
    piadaRes = piadaRes.replace(/(\r\n|\n|\r)/gm, " ");
    const jokeIndex = specificPiadaIndex ? specificPiadaIndex : Piadas.split('\n').indexOf(piadaRes) + 1;
    piadaRes = `#${jokeIndex}/${totalJokes} - ${piadaRes}`;

    client.log.logAndReply(message, piadaRes);

};

piadaCommand.commandName = 'piada';
piadaCommand.aliases = ['piada', 'joke', 'piadas', 'jokes'];
piadaCommand.shortDescription = 'Mostra uma piada aleatória';
piadaCommand.cooldown = 5000;
piadaCommand.whisperable = true;
piadaCommand.description = `Veja uma piada aleatória ou específica quando determinado um número da lista de piadas
• Exemplo: "!piada - O bot vai enviar uma piada aleatória
• Exemplo: "!piada 4 - O bot vai enviar a piada número 4 da lista de piadas`;
piadaCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/${piadaCommand.commandName}/${piadaCommand.commandName}.js`;

module.exports = {
    piadaCommand,
};
