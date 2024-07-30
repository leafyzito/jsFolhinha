const { manageCooldown } = require("../../utils/manageCooldown.js");
const { logAndReply } = require("../../utils/log.js");
const { randomChoice } = require("../../utils/utils.js");
const fs = require('fs');

const Piadas = fs.readFileSync('data/piadas.txt', 'utf8');

const piadaCommand = async (client, message) => {
    message.command = 'piada';
    if (!manageCooldown(5000, 'channel', message.senderUsername, message.command)) return;

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

    logAndReply(client, message, piadaRes);
    
};

module.exports = { piadaCommand: piadaCommand };
