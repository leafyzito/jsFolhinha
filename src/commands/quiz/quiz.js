const quizesData = require("./quizes.json");
const path = require("path");

let usedQuizes = {};

function getRandomQuiz(channelName) {
  if (
    usedQuizes[channelName] &&
    usedQuizes[channelName].length === quizesData.length
  ) {
    usedQuizes = { [channelName]: [] };
  }

  // Get available quizzes that haven't been used (by id)
  const availableQuizes = quizesData.filter(
    (quiz) =>
      !usedQuizes[channelName] || !usedQuizes[channelName].includes(quiz.id)
  );

  // Select a random quiz
  const quiz = fb.utils.randomChoice(availableQuizes);

  // Initialize usedQuizes for this channel if it doesn't exist
  if (!usedQuizes[channelName]) {
    usedQuizes[channelName] = [];
  }

  usedQuizes[channelName].push(quiz.id);

  console.log(`[QUIZ #${channelName}] Resposta: ${quiz.resposta}`);
  return quiz;
}

const quizCommand = async (message) => {
  const quiz = getRandomQuiz(message.channelName);
  // console.log(quiz);

  await fb.log.reply(
    message,
    `📚 Hora de quiz! ● Categoria: ${
      quiz.categoria
    } ● Dificuldade: ${fb.utils.capitalize(quiz.dificuldade)} ● ${
      quiz.pergunta
    }`
  );

  const check = {
    channelName: message.channelName,
    content: quiz.resposta,
  };
  const responseMsg = await fb.utils.waitForMessage(check);
  if (!responseMsg) {
    const emote = await fb.emotes.getEmoteFromList(
      message.channelName,
      fb.emotes.sadEmotes,
      ":("
    );
    return {
      reply: `Ninguém respondeu o quiz a tempo! ${emote} A resposta era: ${quiz.resposta[0]}`,
      notes: `${quiz.pergunta} -> ${quiz.resposta[0]}`,
    };
  }

  const emote = await fb.emotes.getEmoteFromList(
    message.channelName,
    ["nerd", "nerdge", "catnerd", "dognerd", "giganerd"],
    "🤓"
  );
  return {
    reply: `${responseMsg.senderUsername} acertou a resposta! ${emote}`,
    notes: `${quiz.pergunta} -> ${quiz.resposta[0]}`,
  };
};

quizCommand.commandName = "quiz";
quizCommand.aliases = ["quiz", "quizes", "trivia"];
quizCommand.shortDescription = "Inicie um quiz que todos podem participar";
quizCommand.cooldown = 30_000;
quizCommand.cooldownType = "channel";
quizCommand.whisperable = false;
quizCommand.description = `Inicie um quiz que todos do chat (no qual o comando foi executado) podem participar
Se ninguém do chat responder o quiz a tempo dentro de 30 segundos, a resposta será revelada`;
quizCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/src/commands/${__dirname
  .split(path.sep)
  .pop()}/${__filename.split(path.sep).pop()}`;

module.exports = {
  quizCommand,
};
