const { processCommand } = require("../../utils/processCommand.js");

const percentagemCommand = async (client, message) => {
    message.command = '%';
    if (!await processCommand(5000, 'channel', message, client)) return;

    const randomPercentage = (Math.random() * 100).toFixed(2);

    client.log.logAndReply(message, `${randomPercentage}%`);
};

percentagemCommand.commandName = '%';
percentagemCommand.aliases = ['percentagem', '%'];
percentagemCommand.shortDescription = 'Mostra uma percentagem aleatória';
percentagemCommand.cooldown = 5000;
percentagemCommand.whisperable = true;
percentagemCommand.description = 'Uso: !% <quantidade>; Resposta esperada: {percentagem aleatória}';
percentagemCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/percentagem/percentagem.js`;

module.exports = {
    percentagemCommand,
};
