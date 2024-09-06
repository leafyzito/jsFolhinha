const { processCommand } = require("../../utils/processCommand.js");

const testeCommand = async (client, message) => {
    message.command = 'teste';
    if (!await processCommand(5000, 'channel', message, client)) return;

    const invoked_by = message.messageText.split(" ", 1)[0].slice(message.commandPrefix.length).toLowerCase();
    console.log(invoked_by);

    client.log.logAndReply(message, 'testado 3');
    return;
};

testeCommand.commandName = 'teste';
testeCommand.aliases = ['teste', 'test', 'testing'];
testeCommand.shortDescription = 'Este é apenas um comando para verificar se o bot está vivo, nada de especial';
testeCommand.cooldown = 5000;
testeCommand.whisperable = true;
testeCommand.description = 'Uso: !teste; Resposta esperada: testado 3';
testeCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/${testeCommand.commandName}/${testeCommand.commandName}.js`;

module.exports = {
    testeCommand,
};
