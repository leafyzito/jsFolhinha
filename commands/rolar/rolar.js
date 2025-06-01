import { processCommand } from '../../utils/processCommand.js';
import { randomInt } from '../../utils/utils.js';

const rolarCommand = async (client, message) => {
    message.command = 'rolar';
    if (!(await processCommand(5000, 'channel', message, client))) return;

    if (message.messageText.split(' ').length === 1) {
        client.log.logAndReply(
            message,
            `Use o formato: ${message.commandPrefix}rolar <quantos dados> <de quantos lados>`
        );
        return;
    }

    const args = message.messageText.split(' ').slice(1);

    let dice = args[0];
    let sides = args[1].replace(/d/g, '');

    if (dice.includes('d')) {
        sides = dice.split('d')[1];
        dice = dice.split('d')[0];
    }

    if (!dice || !sides) {
        client.log.logAndReply(
            message,
            `Use o formato: ${message.commandPrefix}rolar <quantos dados> <de quantos lados>`
        );
        return;
    }

    if (isNaN(dice) || isNaN(sides) || dice < 1 || sides < 1) {
        client.log.logAndReply(
            message,
            `Use o formato: ${message.commandPrefix}rolar <quantos dados> <de quantos lados>`
        );
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

    // sort roladas ascending
    roladas.sort((a, b) => a - b);

    const sum = roladas.reduce((a, b) => a + b, 0);

    client.log.logAndReply(
        message,
        `${roladas.length === 1 ? 'A sua rolada foi:' : 'As suas roladas foram:'} ${roladas.join(', ')}${roladas.length > 1 ? ` (soma: ${sum})` : ''} 🎲`
    );
};

rolarCommand.commandName = 'rolar';
rolarCommand.aliases = ['rolar', 'roll'];
rolarCommand.shortDescription = 'Lance um ou mais dados';
rolarCommand.cooldown = 5000;
rolarCommand.whisperable = true;
rolarCommand.description = `Lance até 10 dados com quantos lados você quiser, com limite de 100 lados
• Exemplo: !rolar 2 10 - O bot irá lançar 2 dados de 10 lados
• Exemplo: !rolar 6d10 - O bot irá lançar 6 dados de 10 lados`;
rolarCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/${rolarCommand.commandName}/${rolarCommand.commandName}.js`;

export { rolarCommand };
