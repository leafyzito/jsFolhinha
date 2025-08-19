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

const EightBallCommand = async () => {
  return {
    reply: `🎱 ${fb.utils.randomChoice(ball_responses)}`,
  };
};

EightBallCommand.commandName = "8ball";
EightBallCommand.aliases = ["8ball", "8b", "ball"];
EightBallCommand.shortDescription =
  'Uma simulação de um "8ball" e receber uma resposta aleatória';
EightBallCommand.cooldown = 5000;
EightBallCommand.cooldownType = "channel";
EightBallCommand.whisperable = true;
EightBallCommand.description =
  "Uso: !8ball; Resposta esperada: Sinais apontam que sim/Não conte com isso/etc";
EightBallCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/src/commands/${__dirname
  .split("/")
  .pop()}/${__filename.split("/").pop()}`;

module.exports = {
  EightBallCommand,
};
