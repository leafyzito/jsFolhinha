const { manageCooldown } = require("../../utils/manageCooldown.js");
const { logAndReply } = require("../../utils/log.js");
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
    if (!manageCooldown(5000, 'channel', message.senderUsername, message.command)) return;

    const cancelTarget = message.messageText.split(' ')[1]?.replace(/^@/, '') || message.senderUsername;

	if (['folhinha', 'folhinhabot'].includes(cancelTarget.toLowerCase())) {
        logAndReply(client, message, `Stare ow`);
        return;
    }

    const randomCancelamento = randomChoice(Cancelamentos);

    logAndReply(client, message, 
        `${cancelTarget == message.senderUsername ? `${cancelTarget} se auto-cancelou por ${randomCancelamento}` : `${message.senderUsername} cancelou ${cancelTarget} por ${randomCancelamento}`}`);
    

};

module.exports = { cancelarCommand: cancelarCommand };
