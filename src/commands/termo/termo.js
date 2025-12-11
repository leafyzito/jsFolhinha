const path = require("path");
const fs = require("fs");
const palavrasPath = path.join(__dirname, "palavras.txt");

let palavras = [];
try {
  const data = fs.readFileSync(palavrasPath, "utf-8");
  palavras = data
    .split("\n")
    .map((w) => w.trim())
    .filter((w) => w.length > 0);
} catch (e) {
  console.error("Não foi possível carregar palavras.txt:", e);
  palavras = [];
}

// Helper to generate wordle-like response AND return info about correct/wrong letters
function getWordleResponse(answer, guess) {
  guess = guess.toLowerCase();
  answer = answer.toLowerCase();

  if (guess.length !== answer.length) {
    return {
      feedback: `A palavra tem ${answer.length} letras`,
      correctLetters: [],
      wrongLetters: [],
    };
  }

  const result = [];
  const answerArr = answer.split("");
  const guessArr = guess.split("");

  // Mark used letters
  const used = Array(answer.length).fill(false);

  const correctLettersSet = new Set();

  // First pass: mark exact letters (🟩)
  for (let i = 0; i < guessArr.length; i++) {
    if (guessArr[i] === answerArr[i]) {
      result[i] = "🟩";
      used[i] = true;
      correctLettersSet.add(guessArr[i].toUpperCase());
    }
  }

  // Second pass: mark present but misplaced (🟨) and absent (⬛)
  for (let i = 0; i < guessArr.length; i++) {
    if (result[i]) continue; // already 🟩

    let found = false;
    for (let j = 0; j < answerArr.length; j++) {
      if (!used[j] && guessArr[i] === answerArr[j]) {
        found = true;
        used[j] = true;
        break;
      }
    }
    result[i] = found ? "🟨" : "⬛";
    if (found) {
      correctLettersSet.add(guessArr[i].toUpperCase());
    }
  }

  // All letters in guess (unique, uppercase)
  const guessLettersSet = new Set(
    guessArr.filter((l) => /^[a-z]$/i.test(l)).map((l) => l.toUpperCase())
  );
  // All letters in answer (unique, uppercase)
  const answerLettersSet = new Set(
    answerArr.filter((l) => /^[a-z]$/i.test(l)).map((l) => l.toUpperCase())
  );

  // Wrong letters: guessed but not in answer
  const wrongLettersSet = new Set();
  for (const l of guessLettersSet) {
    if (!answerLettersSet.has(l)) {
      wrongLettersSet.add(l);
    }
  }

  return {
    feedback: result.join(" "),
    correctLetters: Array.from(correctLettersSet),
    wrongLetters: Array.from(wrongLettersSet),
  };
}

// Helper to keep and update used letters
function updateUsedLetters(usedLettersSet, guess) {
  guess.split("").forEach((char) => {
    if (/^[a-z]$/i.test(char)) {
      usedLettersSet.add(char.toUpperCase());
    }
  });
}

// Always display sorted
function formatLetterList(arr) {
  return arr.length ? arr.sort((a, b) => a.localeCompare(b)).join(", ") : "-";
}

// Helper: format ms as "Xm Ys" or "Ys"
function formatTimeLeft(ms) {
  if (ms <= 0 || isNaN(ms)) return "";
  const seconds = Math.ceil(ms / 1000);
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  if (min > 0) {
    return `${min}m${sec > 0 ? ` ${sec}s` : ""}`;
  }
  return `${sec}s`;
}

// A map to hold active games by channelName
const termoGamesByChannel = new Map();

const termoCommand = async (message) => {
  // Only allow one game per channel at a time
  if (termoGamesByChannel.has(message.channelName)) {
    return {
      reply:
        "Já existe um jogo a decorrer neste chat, ajude a adivinhar a palavra!",
    };
  }

  // Setup the game state for this channel
  const gameState = {
    startTime: new Date(Date.now() + 5 * 60 * 1000), // 5 min from now
    randomWord: fb.utils.randomChoice(palavras),
    usedLetters: new Set(),
    globalCorrectLetters: new Set(),
    globalWrongLetters: new Set(),
    lastCheckRes: undefined,
    acertou: false,
  };

  termoGamesByChannel.set(message.channelName, gameState);

  fb.log.send(
    message.channelName,
    `🎲 ${message.displayName} começou um jogo de Termo! Tem 6 tentativas para adivinhar a palavra de 5 letras`
  );
  console.log(
    `[TERMO][${message.channelName}] Palavra: ${gameState.randomWord}`
  );

  const check = {
    channelName: message.channelName,
    senderUsername: message.senderUsername,
  };

  for (let i = 0; i < 6; i++) {
    gameState.lastCheckRes = await fb.utils.waitForMessage(check, 120_000);
    if (gameState.lastCheckRes) {
      const guess = gameState.lastCheckRes.messageText.toLowerCase();
      updateUsedLetters(gameState.usedLetters, guess);

      if (gameState.randomWord === guess) {
        // Mark all correct (for display)
        guess.split("").forEach((ch) => {
          if (/^[a-z]$/i.test(ch)) {
            gameState.globalCorrectLetters.add(ch.toUpperCase());
          }
        });
        gameState.acertou = true;
        break;
      } else {
        if (i == 5) break;

        const wordleRes = getWordleResponse(gameState.randomWord, guess);
        if (
          typeof wordleRes === "string" ||
          wordleRes.feedback.startsWith("A palavra tem")
        ) {
          // Error message, show exactly as before
          fb.log.reply(
            gameState.lastCheckRes,
            `Tentativa ${i + 1} de 6: ${wordleRes.feedback}`
          );
        } else {
          // Add to global correct and wrong sets
          wordleRes.correctLetters.forEach((ch) =>
            gameState.globalCorrectLetters.add(ch)
          );
          wordleRes.wrongLetters.forEach((ch) =>
            gameState.globalWrongLetters.add(ch)
          );
          // If a letter is correct, remove from globalWrongLetters (in case it moves from wrong to correct)
          wordleRes.correctLetters.forEach((ch) =>
            gameState.globalWrongLetters.delete(ch)
          );

          fb.log.reply(
            gameState.lastCheckRes,
            `Tentativa ${i + 1} de 6: ${
              wordleRes.feedback
            } ● ✅ Letras certas: ${formatLetterList(
              Array.from(gameState.globalCorrectLetters)
            )} ● ❌ Letras erradas: ${formatLetterList(
              Array.from(gameState.globalWrongLetters)
            )}`
          );
        }
      }
    } else {
      console.log(
        `[TERMO][${message.channelName}] Timeout or no message received.`
      );
      break;
    }
  }

  // Calculate time for next game as humanized string using formatTimeLeft helper
  const now = new Date();
  const msToNextGame = gameState.startTime.getTime() - now.getTime();
  let timeForNextGame = "";
  const timeFormatted = formatTimeLeft(msToNextGame);
  if (timeFormatted) {
    timeForNextGame = ` ● Próximo Termo disponível em ${timeFormatted}`;
  }

  // Finish and cleanup the game state
  termoGamesByChannel.delete(message.channelName);

  if (gameState.acertou) {
    const emote = await fb.emotes.getEmoteFromList(
      message.channelName,
      fb.emotes.pogEmotes,
      "PogChamp"
    );
    return {
      reply: ` ${gameState.lastCheckRes.displayName} acertou a resposta: ${gameState.randomWord} ${emote} ${timeForNextGame}`,
    };
  }

  const emote = await fb.emotes.getEmoteFromList(
    message.channelName,
    fb.emotes.sadEmotes,
    ":("
  );
  return {
    reply: `Tentativas esgotadas ${emote} A palavra era: ${gameState.randomWord} ${timeForNextGame}`,
  };
};

termoCommand.commandName = "termo";
termoCommand.aliases = ["termo", "wordle", "raiosfunde"];
termoCommand.shortDescription = "Jogo do Termo no chat";
termoCommand.cooldown = 300_000;
termoCommand.cooldownType = "channel";
termoCommand.whisperable = false;
termoCommand.description = `Comece um jogo do Termo no chat! Tente adivinhar a palavra secreta de 5 letras em até 6 tentativas consecutivas. O bot responde após cada tentativa com 🟩 (letra correta no lugar correto), 🟨 (letra correta no lugar errado) ou ⬛ (letra ausente). Seu progresso de letras certas e erradas é exibido a cada rodada 

Digite suas respostas diretamente no chat após iniciar o comando

Apesar do comando apenas reagir às mensagens de quem executou o comando, todo o chat pode ajudar com dicas, para depois quem executou o comando poder adivinhar`;
termoCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/src/commands/termo/termo.js`;

module.exports = {
  termoCommand,
};
