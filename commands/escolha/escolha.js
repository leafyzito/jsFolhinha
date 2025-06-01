import { processCommand } from '../../utils/processCommand.js';
import { randomChoice } from '../../utils/utils.js';

const escolhaCommand = async (client, message) => {
    message.command = 'escolha';
    if (!(await processCommand(5000, 'channel', message, client))) return;

    const args = message.messageText.split(' ').slice(1);

    // remove all 'ou' and 'or' from the list of options
    for (let i = 0; i < args.length; i++) {
        console.log(args);
        if (args[i].toLowerCase() === 'ou' || args[i].toLowerCase() === 'or') {
            args.splice(i, 1);
            i--; // Adjust index after removal
        }
    }

    if (args.length < 2) {
        client.log.logAndReply(message, `Intruduza pelo menos 2 elementos pra serem escolhidos`);
        return;
    }

    const choice = randomChoice(args.slice(0, args.length));
    client.log.logAndReply(message, `🤖 ${choice}`);
};

escolhaCommand.commandName = 'escolha';
escolhaCommand.aliases = ['escolha', 'escolher', 'choose', 'choice', 'pick'];
escolhaCommand.shortDescription = 'Faça o bot escolher um elemento aleatório de uma lista';
escolhaCommand.cooldown = 5000;
escolhaCommand.whisperable = true;
escolhaCommand.description = `Faça o Folhinha escolher entre as escolhas que você fornecer
• Exemplo: !escolha a b c - O bot vai escolher um dos três itens aleatoriamente`;
escolhaCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/${escolhaCommand.commandName}/${escolhaCommand.commandName}.js`;

export { escolhaCommand };
