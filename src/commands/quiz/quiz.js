const quizesData = require("./quizes.json");
const path = require("path");

const usedQuizes = {};

// Get all unique categories from quiz data
const allCategories = [...new Set(quizesData.map((quiz) => quiz.categoria))];

// Category alias mapping (English and Portuguese)
const categoryAliases = {
  "Entretenimento: Video Games": [
    "games",
    "jogos",
    "videogames",
    "video games",
    "jogos de video",
  ],
  "Ciência: Computadores": ["computers", "computadores", "pc", "computador"],
  "Entretenimento: Música": ["music", "musica", "música", "musicas", "músicas"],
  "Entretenimento: Filmes": ["movies", "filmes", "filme", "cinema"],
  "Entretenimento: Televisão": [
    "tv",
    "televisao",
    "televisão",
    "television",
    "series",
    "séries",
  ],
  Esporte: ["sports", "esporte", "esportes", "sport"],
  História: ["history", "historia", "história"],
  Geografia: ["geography", "geografia", "geo"],
  "Ciência e Natureza": [
    "science",
    "ciencia",
    "ciência",
    "natureza",
    "nature",
    "ciencias",
    "ciências",
  ],
  "Entretenimento: Anime": ["anime", "animes"],
  "Entretenimento: Comics": ["comics", "quadrinhos", "quadrinho", "hq", "hqs"],
  "Entretenimento: Livros": ["books", "livros", "livro"],
  "Entretenimento: Board Games": [
    "boardgames",
    "board games",
    "jogos de tabuleiro",
    "tabuleiro",
    "rpg",
    "rpgs",
  ],
  "Ciência: Matemática": [
    "math",
    "matematica",
    "matemática",
    "mathematics",
    "mat",
  ],
  "Ciência: Gadgets": ["gadgets", "gadget"],
  Animais: ["animals", "animais", "animal"],
  Arte: ["art", "arte", "arts"],
  Celebridades: ["celebrities", "celebridades", "celebridade", "celebrity"],
  Mitologia: ["mythology", "mitologia", "mito", "myths", "mitos"],
  Política: ["politics", "politica", "política", "political"],
  Veículos: [
    "vehicles",
    "veiculos",
    "veículos",
    "vehicle",
    "veiculo",
    "veículo",
  ],
  "Conhecimento geral": ["general", "geral", "conhecimento geral"],
  "Cultura geral": ["general", "geral", "cultura geral"],
};

// Find a category by matching aliases first, then partial matching
function findCategory(input) {
  if (!input) return null;

  const normalizedInput = input.trim().toLowerCase();

  // First, check aliases (exact match)
  for (const [category, aliases] of Object.entries(categoryAliases)) {
    if (aliases.some((alias) => alias.toLowerCase() === normalizedInput)) {
      return category;
    }
  }

  // Fall back to case-insensitive partial matching against all category names
  for (const category of allCategories) {
    if (category.toLowerCase().includes(normalizedInput)) {
      return category;
    }
  }

  return null;
}

function getRandomQuiz(channelName, category = null) {
  // Filter quizzes by category if provided
  let filteredQuizes = quizesData;
  if (category) {
    filteredQuizes = quizesData.filter((quiz) => quiz.categoria === category);
    if (filteredQuizes.length === 0) {
      return null; // No quizzes found for this category
    }
  }

  // Check if all quizzes have been used (for the filtered set)
  const usedKey = category
    ? `${channelName}:${category}`
    : `${channelName}:all`;
  if (
    usedQuizes[usedKey] &&
    usedQuizes[usedKey].length === filteredQuizes.length
  ) {
    usedQuizes[usedKey] = [];
  }

  // Get available quizzes that haven't been used (by id)
  const availableQuizes = filteredQuizes.filter(
    (quiz) => !usedQuizes[usedKey] || !usedQuizes[usedKey].includes(quiz.id)
  );

  if (availableQuizes.length === 0) {
    // All quizzes used, reset and try again
    usedQuizes[usedKey] = [];
    return getRandomQuiz(channelName, category);
  }

  // Select a random quiz
  const quiz = fb.utils.randomChoice(availableQuizes);

  // Initialize usedQuizes for this channel/category if it doesn't exist
  if (!usedQuizes[usedKey]) {
    usedQuizes[usedKey] = [];
  }

  usedQuizes[usedKey].push(quiz.id);

  console.log(`[QUIZ #${channelName}] Resposta: ${quiz.resposta}`);
  return quiz;
}

const quizCommand = async (message) => {
  // Parse category argument (everything after the command)
  const categoryInput =
    message.args.length > 1 ? message.args.slice(1).join(" ").trim() : null;

  let matchedCategory = null;
  if (categoryInput) {
    matchedCategory = findCategory(categoryInput);
  }

  // Get quiz (with category filter if matched, otherwise random)
  let quiz = getRandomQuiz(message.channelName, matchedCategory || null);

  // If category was specified but no quiz found, fall back to random
  if (!quiz && matchedCategory) {
    quiz = getRandomQuiz(message.channelName, null);
    matchedCategory = null; // Reset to show it's random
  }

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
Se ninguém do chat responder o quiz a tempo dentro de 30 segundos, a resposta será revelada
Você pode opcionalmente especificar uma categoria (ex: !quiz games ou !quiz jogos)
Lista de categorias: ${allCategories.join(", ")}`;
quizCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/src/commands/${__dirname
  .split(path.sep)
  .pop()}/${__filename.split(path.sep).pop()}`;

module.exports = {
  quizCommand,
};
