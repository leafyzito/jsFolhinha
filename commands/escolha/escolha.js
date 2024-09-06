const { processCommand } = require("../../utils/processCommand.js");
const { randomChoice } = require("../../utils/utils.js");

const escolhaCommand = async (client, message) => {
    message.command = 'escolha';
    if (!await processCommand(5000, 'channel', message, client)) return;

    const args = message.messageText.split(' ').slice(1);

    // remove all 'ou' and 'or' from the list of options
    args.forEach((arg, index) => {
        if (arg.toLowerCase() === 'ou' || arg.toLowerCase() === 'or') {
            args.slice(index, 1);
        }
    });

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
escolhaCommand.description = 'Uso: !escolha <opções>; Resposta esperada: {opção escolhida aleatoriamente da lista de opções}';
escolhaCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/${escolhaCommand.commandName}/${escolhaCommand.commandName}.js`;

module.exports = {
    escolhaCommand,
};
