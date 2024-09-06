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

EightBallCommand.commandName = '8ball';
EightBallCommand.aliases = ['8ball', '8b', 'ball'];
EightBallCommand.shortDescription = 'Uma simulação de um "8ball" e receber uma resposta aleatória';
EightBallCommand.cooldown = 5000;
EightBallCommand.whisperable = true;
EightBallCommand.description = 'Uso: !8ball; Resposta esperada: Sinais apontam que sim/Não conte com isso/etc';
EightBallCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/${EightBallCommand.commandName}/${EightBallCommand.commandName}.js`;

module.exports = {
    EightBallCommand,
};
