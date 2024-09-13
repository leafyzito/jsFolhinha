const { processCommand } = require("../../utils/processCommand.js");
const { randomInt, randomChoice } = require("../../utils/utils.js");

const Cancelamentos = [
    'ser atraente demais',
    'ter charme demais',
    'ser uma pessoa horrível',
    'ser uma grande gostosa',
    'ser boy lixo',
    'ser comunista',
    'debochar demais',
    'ser inteligente demais',
    'ser padrãozinho',
    'pedir muito biscoito',
    'ser corno',
    'ser uma delícia',
    'ser gado demais',
    'não ser ninguém',
    'ser poser',
    'ser insuportável',
    'ser insensível',
    'não fazer nada',
    'ser trouxa',
    'se atrasar sempre',
    'ser impaciente demais',
    'ter virado o Coronga',
    'ser BV',
    'ter muita preguiça',
    'ser inútil',
    'ser inadimplente no Serasa',
    'contar muita piada ruim',
    'procrastinar demais',
    'se considerar incancelável',
    'assistir anime',
    'jogar league of legends'
];

const cancelarCommand = async (client, message) => {
    message.command = 'cancelar';
    if (!await processCommand(5000, 'channel', message, client)) return;

    const cancelTarget = message.messageText.split(' ')[1]?.replace(/^@/, '') || message.senderUsername;

    if (['folhinha', 'folhinhabot'].includes(cancelTarget.toLowerCase())) {
        client.log.logAndReply(message, `Stare ow`);
        return;
    }

    const randomCancelamento = randomChoice(Cancelamentos);

    client.log.logAndReply(message,
        `${cancelTarget == message.senderUsername ? `${cancelTarget} se auto-cancelou por ${randomCancelamento}` : `${message.senderUsername} cancelou ${cancelTarget} por ${randomCancelamento}`}`);


};

cancelarCommand.commandName = 'cancelar';
cancelarCommand.aliases = ['cancelar', 'cancel'];
cancelarCommand.shortDescription = 'Cancela alguém por algum motivo aleatório';
cancelarCommand.cooldown = 5000;
cancelarCommand.whisperable = true;
cancelarCommand.description = `Marque alguém para que seja cancelado por algo aleatório
A lista de motivos aleatórios foi tirada do site https://perchance.org/gerador-cancelamento`;
cancelarCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/${cancelarCommand.commandName}/${cancelarCommand.commandName}.js`;

module.exports = {
    cancelarCommand,
};
