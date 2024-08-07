const { processCommand } = require("../../utils/processCommand.js");
const { randomInt } = require("../../utils/utils.js");
 
const rolarCommand = async (client, message) => {
    message.command = 'rolar';
    if (!await processCommand(5000, 'channel', message, client)) return;

    if (message.messageText.split(' ').length === 1) {
        client.log.logAndReply(message, `Use o formato: ${message.commandPrefix}rolar <quantos dados> <de quantos lados>`);
        return;
    }

    const args = message.messageText.split(' ').slice(1);
    
    var dice = args[0];
    var sides = args[1];

    if (dice.includes('d')) {
        sides = dice.split('d')[1];
        dice = dice.split('d')[0];
    }

    if (!dice || !sides) {
        client.log.logAndReply(message, `Use o formato: ${message.commandPrefix}rolar <quantos dados> <de quantos lados>`);
        return;
    }

    if (isNaN(dice) || isNaN(sides)) {
        client.log.logAndReply(message, `Use o formato: ${message.commandPrefix}rolar <quantos dados> <de quantos lados>`);
        return;
    }

    if (parseInt(dice) > 10 || parseInt(sides) > 100) {
        client.log.logAndReply(message, `O máximo de dados é 10 e o máximo de lados é 100`);
        return;
    }

    const roladas = [];
    for (let i = 0; i < dice; i++) {
        roladas.push(randomInt(1, parseInt(sides)));
    }

    const sum = roladas.reduce((a, b) => a + b, 0);

    client.log.logAndReply(message, `As suas roladas foram: ${roladas.join(', ')} (soma: ${sum}) 🎲`);
};

rolarCommand.aliases = ['rolar', 'roll'];

module.exports = {
    rolarCommand,
};
