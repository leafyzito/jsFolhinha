const { processCommand } = require("../../utils/processCommand.js");

const vanishCommand = async (client, message) => {
    message.command = 'vanish';
    if (!await processCommand(5000, 'user', message, client)) return;

    if (message.isStreamer) {
        client.log.logAndReply(message, `Eu não consigo te fazer desaparecer, mas você consegue monkaS`);
        return;
    }
    
    if (message.isMod) {
        client.log.logAndReply(message, `Você não consegue se esconder aqui Stare`);
        return;
    }

    const vanish = await client.timeoutUser(message, 1, 'vanish');

    if (!vanish) {
        client.log.logAndReply(message, `Eu não tenho mod, então não consigo fazer isso`);
        return;
    }

    return;
};

vanishCommand.aliases = ['vanish'];

module.exports = {
    vanishCommand,
};
