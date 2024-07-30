const { manageCooldown } = require("../../utils/cooldownManager.js");
const { logAndReply } = require("../../utils/log.js");
const { randomInt } = require("../../utils/utils.js");

const coinflipCommand = async (client, message) => {
    message.command = 'coinflip';
    if (!manageCooldown(5000, 'channel', message.senderUsername, message.command)) return;

    const standingCoin = randomInt(0, 1000); // 0.1% chance of standing coin

    // #TODO: getEmoteFromList
    if (standingCoin === 0) {
        logAndReply(client, message, `A moeda ficou em pé (0.1% de chance de acontecer) PogChamp`);
        return;
    }

    const coin = randomInt(0, 1);
    if (coin === 0) {
        logAndReply(client, message, 'Cara (sim)');
        return;
    } else {
        logAndReply(client, message, 'Coroa (não)');
        return;
    }

};


module.exports = { coinflipCommand: coinflipCommand};
