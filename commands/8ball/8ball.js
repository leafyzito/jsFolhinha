const { processCommand } = require("../../utils/processCommand.js");
const { randomInt } = require("../../utils/utils.js");

const ball_responses = [
    "É certo",
    "É decididamente assim",
    "Sem dúvida",
    "Sim definitivamente",
    "Pode contar com isso",
    "A meu ver, sim",
    "Provavelmente",
    "Parece-me que sim",
    "Sim",
    "Sinais apontam que sim",
    "Resposta nebulosa, tente novamente",
    "Pergunte novamente mais tarde",
    "Melhor não te dizer agora",
    "Não é possível prever agora",
    "Concentre-se e pergunte de novo",
    "Não conte com isso",
    "Minha resposta é não",
    "Minhas fontes dizem não",
    "Parece-me que não",
    "Muito duvidoso",
];

const EightBallCommand = async (client, message) => {
    message.command = '8ball';
    if (!await processCommand(5000, 'channel', message, client)) return;

    randomResponse = randomInt(0, ball_responses.length - 1);
    client.log.logAndReply(message, `${ball_responses[randomResponse]}`);

};


module.exports = {
    EightBallCommand: EightBallCommand,
    EightBallAliases: ['8ball', '8b', 'ball']
};
