const { processCommand } = require("../../utils/processCommand.js");
const { randomInt } = require("../../utils/utils.js");

const coinflipCommand = async (client, message) => {
    message.command = 'coinflip';
    if (!await processCommand(5000, 'channel', message, client)) return;

    const standingCoin = randomInt(0, 1000); // 0.1% chance of standing coin

    if (standingCoin === 0) {
        const emote = await client.emotes.getEmoteFromList(message.channelName, client.emotes.pogEmotes, 'PogChamp')
        client.log.logAndReply(message, `A moeda ficou em pé (0.1% de chance de acontecer) ${emote}`);
        return;
    }

    const coin = randomInt(0, 1);
    if (coin === 0) {
        client.log.logAndReply(message, '🪙 Cara (sim)');
        return;
    } else {
        client.log.logAndReply(message, '🪙 Coroa (não)');
        return;
    }

};

coinflipCommand.commandName = 'coinflip';
coinflipCommand.aliases = ['coinflip', 'cf'];
coinflipCommand.shortDescription = 'Lance uma moeda ao ar';
coinflipCommand.cooldown = 5000;
coinflipCommand.whisperable = true;
coinflipCommand.description = 'Lance uma moeda ao ar e deixe que ela escolha o destino (cara ou coroa)';
coinflipCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/${coinflipCommand.commandName}/${coinflipCommand.commandName}.js`;

module.exports = {
    coinflipCommand,
};
