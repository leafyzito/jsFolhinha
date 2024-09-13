const { processCommand } = require("../../utils/processCommand.js");
const { randomChoice } = require("../../utils/utils.js");
const fs = require('fs');

const Curiosidades = fs.readFileSync('data/curiosidades.txt', 'utf8');

const curiosidadeCommand = async (client, message) => {
    message.command = 'curiosidade';
    if (!await processCommand(5000, 'channel', message, client)) return;

    const totalCuriosidades = Curiosidades.split('\n').length - 1;
    const specificCuriosidadeIndex = message.messageText.split(' ')[1] ? parseInt(message.messageText.split(' ')[1]) : null;
    let curiosidadeRes = specificCuriosidadeIndex ? Curiosidades.split('\n')[specificCuriosidadeIndex - 1] : randomChoice(Curiosidades.split('\n'));

    if (specificCuriosidadeIndex) {
        if (specificCuriosidadeIndex < 1 || specificCuriosidadeIndex > totalCuriosidades) {
            curiosidadeRes = `Escolha um número entre 1 e ${totalCuriosidades} para escolher uma copypasta específica`;
        }
    }

    // remove \n and \r from copypastaRes
    curiosidadeRes = curiosidadeRes.replace(/(\r\n|\n|\r)/gm, " ");
    const curiosidadeIndex = specificCuriosidadeIndex ? specificCuriosidadeIndex : Curiosidades.split('\n').indexOf(curiosidadeRes) + 1;
    curiosidadeRes = `#${curiosidadeIndex}/${totalCuriosidades} - ${curiosidadeRes}`;

    client.log.logAndReply(message, curiosidadeRes);

};

curiosidadeCommand.commandName = 'curiosidade';
curiosidadeCommand.aliases = ['curiosidade', 'curiosidades'];
curiosidadeCommand.shortDescription = 'Mostra uma curiosidade aleatória';
curiosidadeCommand.cooldown = 5000;
curiosidadeCommand.whisperable = true;
curiosidadeCommand.description = `Veja uma curiosidade aleatória ou específica quando determinado um número da lista de curiosidades
• Exemplo: "!curiosidade - O bot vai enviar uma curiosidade aleatória
• Exemplo: "!curiosidade 4 - O bot vai enviar a curiosidade número 4 da lista de curiosidades`;
curiosidadeCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/${curiosidadeCommand.commandName}/${curiosidadeCommand.commandName}.js`;

module.exports = {
    curiosidadeCommand,
};
