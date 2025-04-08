const { processCommand } = require("../../utils/processCommand.js");
const { randomChoice } = require("../../utils/utils.js");
const fs = require('fs');

const Filosofias = fs.readFileSync('./commands/filosofia/filosofias.txt', 'utf8');

const filosofiaCommand = async (client, message) => {
    message.command = 'filosofia';
    if (!await processCommand(5000, 'channel', message, client)) return;

    const totalFilosofias = Filosofias.split('\n').length - 1;
    const specificFilosofiaIndex = message.messageText.split(' ')[1] ? parseInt(message.messageText.split(' ')[1]) : null;
    let filosofiaRes = specificFilosofiaIndex ? Filosofias.split('\n')[specificFilosofiaIndex - 1] : randomChoice(Filosofias.split('\n'));

    if (specificFilosofiaIndex) {
        if (specificFilosofiaIndex < 1 || specificFilosofiaIndex > totalFilosofias) {
            filosofiaRes = `Escolha um número entre 1 e ${totalFilosofias} para escolher uma filosofia específica`;
        }
    }

    // remove \n and \r from copypastaRes
    filosofiaRes = filosofiaRes.replace(/(\r\n|\n|\r)/gm, " ");
    const jokeIndex = specificFilosofiaIndex ? specificFilosofiaIndex : Filosofias.split('\n').indexOf(filosofiaRes) + 1;
    filosofiaRes = `#${jokeIndex}/${totalFilosofias} - ${filosofiaRes}`;

    client.log.logAndReply(message, filosofiaRes);

};

filosofiaCommand.commandName = 'filosofia';
filosofiaCommand.aliases = ['filosofia', 'filosofias'];
filosofiaCommand.shortDescription = 'Mostra uma filosofia aleatória';
filosofiaCommand.cooldown = 5000;
filosofiaCommand.whisperable = true;
filosofiaCommand.description = `Veja uma filosofia aleatória ou específica quando determinado um número da lista de filosofias
• Exemplo: "!filosofia - O bot vai enviar uma filosofia aleatória
• Exemplo: "!filosofia 4 - O bot vai enviar a filosofia número 4 da lista de filosofias`;
filosofiaCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/${filosofiaCommand.commandName}/${filosofiaCommand.commandName}.js`;

module.exports = {
    filosofiaCommand,
};
