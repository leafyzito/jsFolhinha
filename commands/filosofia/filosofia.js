const { manageCooldown } = require("../../utils/manageCooldown.js");
const { randomChoice } = require("../../utils/utils.js");
const fs = require('fs');

const Filosofias = fs.readFileSync('data/filosofias.txt', 'utf8');

const filosofiaCommand = async (client, message) => {
    message.command = 'filosofia';
    if (!manageCooldown(5000, 'channel', message.senderUsername, message.command)) return;

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

module.exports = {
    filosofiaCommand: filosofiaCommand,
    filosofiaAliases: ['filosofia']
};
