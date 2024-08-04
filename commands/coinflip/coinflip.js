const { processCommand } = require("../../utils/processCommand.js");
const { randomInt } = require("../../utils/utils.js");

const coinflipCommand = async (client, message) => {
    message.command = 'coinflip';
    if (!await processCommand(5000, 'channel', message, client)) return;

    const standingCoin = randomInt(0, 1000); // 0.1% chance of standing coin

    // #TODO: getEmoteFromList
    if (standingCoin === 0) {
        client.log.logAndReply(message, `A moeda ficou em pé (0.1% de chance de acontecer) PogChamp`);
        return;
    }

    const coin = randomInt(0, 1);
    if (coin === 0) {
        client.log.logAndReply(message, 'Cara (sim)');
        return;
    } else {
        client.log.logAndReply(message, 'Coroa (não)');
        return;
    }

};

coinflipCommand.aliases = ['coinflip', 'cf'];

module.exports = {
    coinflipCommand,
};
