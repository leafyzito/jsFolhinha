let pendingPlayers = [];

const jokenpoCommand = async (message) => {
  if (pendingPlayers.includes(message.senderUsername.toLowerCase())) {
    return {
      reply: `Termine a sua partida atual antes de iniciar outra`,
    };
  }

  const gameTarget = message.args[1]?.replace(/^@/, "");
  if (!gameTarget) {
    return {
      reply: `Desafie alguém para jogar jokenpo com ${message.prefix}jokenpo <usuário>`,
    };
  }

  if (pendingPlayers.includes(gameTarget.toLowerCase())) {
    return {
      reply: `${gameTarget} já está numa partida. Deixe ele terminar para poder jogar outra partida`,
    };
  }

  if (gameTarget.toLowerCase() === message.senderUsername.toLowerCase()) {
    return {
      reply: `Você não pode jogar com você mesmo Stare`,
    };
  }

  if (gameTarget.toLowerCase() === "folhinhabot") {
    return {
      reply: `Quero não Stare`,
    };
  }

  const targetUserId = (await fb.api.helix.getUserByUsername(gameTarget))?.id;
  if (!targetUserId) {
    return {
      reply: `Esse usuário não existe`,
    };
  }

  // Add players to pending list
  pendingPlayers.push(message.senderUsername.toLowerCase());
  pendingPlayers.push(gameTarget.toLowerCase());

  // Send challenge message
  const challengeMessage = `Você desafiou ${gameTarget} para um jogo de jokenpô. Ambos têm 30 segundos para enviar no meu susurro as suas jogadas (pedra, papel ou tesoura)`;
  fb.log.send(message.channelName, challengeMessage);

  // Wait for both players to respond using whisper
  const answers = {};

  // Wait for first player's response
  const firstPlayerResponse = await fb.utils.waitForWhisper(
    {
      senderUsername: message.senderUsername,
      channelName: "whisper",
      content: ["pedra", "papel", "tesoura"],
    },
    30_000
  );

  if (firstPlayerResponse) {
    answers[message.senderUsername] = firstPlayerResponse.messageText;
  }

  // Wait for second player's response
  const secondPlayerResponse = await fb.utils.waitForWhisper(
    {
      senderUsername: gameTarget.toLowerCase(),
      channelName: "whisper",
      content: ["pedra", "papel", "tesoura"],
    },
    30_000
  );

  if (secondPlayerResponse) {
    answers[gameTarget.toLowerCase()] = secondPlayerResponse.messageText;
  }

  // Remove players from pending list
  pendingPlayers = pendingPlayers.filter(
    (player) =>
      player !== message.senderUsername.toLowerCase() &&
      player !== gameTarget.toLowerCase()
  );

  if (Object.keys(answers).length !== 2) {
    // Check which player didn't answer
    const players = [message.senderUsername, gameTarget.toLowerCase()];
    const playerWhoDidntAnswer = players.find((player) => !answers[player]);
    const emote = await fb.emotes.getEmoteFromList(
      message.channelName,
      ["pfff", "pffff", "pfft", "porvalo", "mock", "pointandlaugh", "wajaja"],
      "🤭"
    );

    if (Object.keys(answers).length === 1 && playerWhoDidntAnswer) {
      return {
        reply: `${playerWhoDidntAnswer} não respondeu, ficou com medo ${emote}`,
      };
    } else {
      return {
        reply: `Nenhum dos jogadores respondeu, ficaram com medo ${emote}`,
      };
    }
  }

  const user1Answer = answers[message.senderUsername];
  const user2Answer = answers[gameTarget.toLowerCase()];

  let gameResult = "";

  // Determine winner based on game rules
  const gameRules = {
    pedra: { papel: -1, tesoura: 1, pedra: 0 },
    papel: { tesoura: -1, pedra: 1, papel: 0 },
    tesoura: { pedra: -1, papel: 1, tesoura: 0 },
  };

  const user1Choice = user1Answer.toLowerCase();
  const user2Choice = user2Answer.toLowerCase();

  if (!gameRules[user1Choice]) {
    return {
      reply: `Algo deu errado eu acho, tente novamente. Se o erro persistir, entre em contato com o @${process.env.DEV_USERNAME}`,
    };
  }

  const result = gameRules[user1Choice][user2Choice];
  const emojis = { pedra: "🪨", papel: "📄", tesoura: "✂️" };

  if (result === 1) {
    gameResult = `${message.senderUsername} ${emojis[user1Choice]} X ${emojis[user2Choice]} ${gameTarget} - ${message.senderUsername} venceu! 🏆`;
  } else if (result === -1) {
    gameResult = `${message.senderUsername} ${emojis[user1Choice]} X ${emojis[user2Choice]} ${gameTarget} - ${gameTarget} venceu! 🏆`;
  } else {
    gameResult = `${message.senderUsername} ${emojis[user1Choice]} X ${emojis[user2Choice]} ${gameTarget} - É um empate!`;
  }

  return {
    reply: gameResult,
  };
};

jokenpoCommand.commandName = "jokenpo";
jokenpoCommand.aliases = ["jokenpo", "jokenpô", "pedrapapeltesoura", "ppt"];
jokenpoCommand.shortDescription =
  "Escolha um adversário para um jogo de jokenpô";
jokenpoCommand.cooldown = 10_000;
jokenpoCommand.cooldownType = "channel";
jokenpoCommand.whisperable = false;
jokenpoCommand.description = `Jogue uma partida de jokenpô com alguém do chat
As jogadas devem ser enviadas para o susurro do bot dentro de 30 segundos - pedra, papel ou tesoura`;
jokenpoCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/src/commands/${jokenpoCommand.commandName}/${jokenpoCommand.commandName}.js`;

module.exports = {
  jokenpoCommand,
};
