const { processCommand } = require("../../utils/processCommand.js");

const percentagemCommand = async (client, message) => {
    message.command = '%';
    if (!await processCommand(5000, 'channel', message, client)) return;

    const randomPercentage = (Math.random() * 100).toFixed(2);

    client.log.logAndReply(message, `${randomPercentage}%`);
};

percentagemCommand.aliases = ['percentagem', '%'];

module.exports = {
    percentagemCommand,
};
