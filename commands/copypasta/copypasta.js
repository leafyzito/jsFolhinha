const { processCommand } = require("../../utils/processCommand.js");
const { randomChoice } = require("../../utils/utils.js");
const fs = require('fs');

const Copypastas = fs.readFileSync('data/copypastas.txt', 'utf8');

const copypastaCommand = async (client, message) => {
    message.command = 'copypasta';
    if (!await processCommand(5000, 'channel', message, client)) return;

    const totalCopys = Copypastas.split('\n').length - 1;
    const specificCopypastaIndex = message.messageText.split(' ')[1] ? parseInt(message.messageText.split(' ')[1]) : null;
    let copypastaRes = specificCopypastaIndex ? Copypastas.split('\n')[specificCopypastaIndex - 1] : randomChoice(Copypastas.split('\n'));

    if (specificCopypastaIndex) {
        if (specificCopypastaIndex < 1 || specificCopypastaIndex > totalCopys) {
            copypastaRes = `Escolha um número entre 1 e ${totalCopys} para escolher uma copypasta específica`;
        }
    }

    // remove \n and \r from copypastaRes
    copypastaRes = copypastaRes.replace(/(\r\n|\n|\r)/gm, " ");
    const copyIndex = specificCopypastaIndex ? specificCopypastaIndex : Copypastas.split('\n').indexOf(copypastaRes) + 1;
    copypastaRes = `#${copyIndex}/${totalCopys} - ${copypastaRes}`;

    client.log.logAndReply(message, copypastaRes);

};

module.exports = {
    copypastaCommand: copypastaCommand,
    copypastaAliases: ['copypasta', 'copy']
};
