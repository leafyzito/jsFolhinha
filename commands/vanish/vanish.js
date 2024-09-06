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

vanishCommand.commandName = 'vanish';
vanishCommand.aliases = ['vanish'];
vanishCommand.shortDescription = 'Limpe as suas mensagens do chat';
vanishCommand.cooldown = 5000;
vanishCommand.whisperable = false;
vanishCommand.description = 'Uso: !vanish; O bot vai lhe dar um timeout de 1 segundo para apagar as suas mensagens. É necessário o bot ser moderador para este comando ter efeito';
vanishCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/${vanishCommand.commandName}/${vanishCommand.commandName}.js`;

module.exports = {
    vanishCommand,
};
