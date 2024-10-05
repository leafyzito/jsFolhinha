const { processCommand } = require("../../utils/processCommand.js");

async function createJokenpoBase(client, user) {
    const userId = await client.getUserID(user);
    const insert_doc = {
        userId: userId,
        username: user,
        wins: 0,
        losses: 0,
        ties: 0
    };

    await client.db.insert('jokenpo', insert_doc);
    return insert_doc;
}

async function waitForJokenpoInputs(client, check, timeout = 30_000) {
    let answers = {};
    return new Promise((resolve) => {
        const timer = setTimeout(() => {
            resolve(null);
        }, timeout);

        client.on('WHISPER', (msg) => {
            if (!answers[msg.senderUsername] && (msg.senderUsername === check.senderUsername1 || msg.senderUsername === check.senderUsername2) &&
                check.content.some(content => msg.messageText.toLowerCase() === content.toLowerCase())) {
                answers[msg.senderUsername] = msg.messageText;
                console.log(answers);
                // clearTimeout(timer);
                // resolve(msg);
                if (Object.keys(answers).length === 2) {
                    clearTimeout(timer);
                    resolve(answers);
                }
            }
        });
    });
}

let pendingPlayers = [];

const jokenpoCommand = async (client, message) => {
    message.command = 'jokenpo';
    if (!await processCommand(5000, 'channel', message, client)) return;

    if (pendingPlayers.includes(message.senderUsername)) {
        client.log.logAndReply(message, `Espere o seu oponente fazer a sua jogada para poder jogar outra partida`);
        return;
    }

    const gameTarget = message.messageText.split(' ')[1]?.replace(/^@/, '');
    if (!gameTarget) {
        client.log.logAndReply(message, `Desafie alguém para jogar jokenpo com ${message.commandPrefix}jokenpo <usuário>`);
        return;
    }

    if (pendingPlayers.includes(gameTarget.toLowerCase())) {
        client.log.logAndReply(message, `${gameTarget} já está numa partida. Deixa ele terminar para poder jogar outra`);
        return;
    }

    if (['show', 'mostrar', 'stats'].includes(gameTarget.toLowerCase())) {
        const targetUser = message.messageText.split(' ')[2]?.replace(/^@/, '') || message.senderUsername;
        let userStats = await client.db.get('jokenpo', { userId: await client.getUserID(targetUser) });
        if (userStats.length === 0) {
            client.log.logAndReply(message, `${targetUser} nunca jogou jokenpo`);
            return;
        }

        userStats = userStats[0];
        const winrate = userStats.wins / (userStats.wins + userStats.losses) * 100;
        await client.log.logAndReply(message, `${targetUser} já jogou ${userStats.wins + userStats.losses + userStats.ties} partidas de jokenpo - ${userStats.wins} vitórias, ${userStats.losses} derrotas e ${userStats.ties} empates - ${winrate.toFixed(2)}% winrate`);
        return;
    }

    if (['top', 'ranking', 'rank', 'leaderboard', 'lb'].includes(gameTarget.toLowerCase())) {
        let rankOption = message.messageText.split(' ')[2]?.toLowerCase() || 'wins';
        if (!['wins', 'losses', 'ties'].includes(rankOption)) { return; }
        let ranking = await client.db.get('jokenpo', {});
        ranking.sort((a, b) => {
            if (['win', 'wins'].includes(rankOption)) {
                return b.wins - a.wins;
            } else if (['loss', 'losses'].includes(rankOption)) {
                return b.losses - a.losses;
            } else if (['tie', 'ties', 'empate', 'empates'].includes(rankOption)) {
                return b.ties - a.ties;
            }
        });

        const top5 = ranking.slice(0, 5);
        let reply = `Top 5 ${rankOption}: `;
        for (let i = 0; i < top5.length; i++) {
            const username = await client.getUserByUserID(top5[i].userId);
            reply += `${i + 1}º ${username}: (${Math.round(top5[i][rankOption])})`;
            if (i !== top5.length - 1) {
                reply += ', ';
            }
        }
        await client.log.logAndReply(message, reply);
        return;
    }

    if (gameTarget.toLowerCase() === 'folhinhabot') {
        client.log.logAndReply(message, `Quero não Stare`);
        return;
    }

    if (!await client.getUserID(gameTarget.toLowerCase())) {
        client.log.logAndReply(message, `Esse usuário não existe`);
        return;
    }

    const check = {
        senderUsername1: message.senderUsername,
        senderUsername2: gameTarget.toLowerCase(),
        // content: ['1', '2', `${message.commandPrefix}1`, `${message.commandPrefix}2`, `${message.commandPrefix}jokenpo 1`, `${message.commandPrefix}jokenpo 2`]
        content: ['pedra', 'papel', 'tesoura']
    };
    client.log.reply(message, `Você desafiou ${gameTarget} para um jogo de jokenpo. Ambos têm 30 segundos para enviar no meu whisper as suas jogadas (pedra, papel ou tesoura)`);
    pendingPlayers.push(message.senderUsername);
    pendingPlayers.push(gameTarget.toLowerCase());
    const answers = await waitForJokenpoInputs(client, check, 30_000);
    if (!answers) {
        client.log.logAndReply(message, `Pelo menos um dos jogadores não respondeu, ficou com medo`);
        // remove players names from pendingPlayers
        pendingPlayers = pendingPlayers.filter(player => player !== message.senderUsername && player !== gameTarget.toLowerCase());
        return;
    }

    const user1Answer = answers[message.senderUsername];
    const user2Answer = answers[gameTarget.toLowerCase()];

    let winner = null;
    let looser = null;
    switch (user1Answer.toLowerCase()) {
        case 'pedra':
            if (user2Answer.toLowerCase() === 'papel') {
                client.log.logAndReply(message, `${message.senderUsername} usou pedra 🪨 e ${gameTarget} usou papel 📄! ${gameTarget} é o vencedor! 🏆`);
                winner = gameTarget;
                looser = message.senderUsername;
            }
            if (user2Answer.toLowerCase() === 'tesoura') {
                client.log.logAndReply(message, `${message.senderUsername} usou pedra 🪨 e ${gameTarget} usou tesoura ✂️! ${message.senderUsername} é o vencedor! 🏆`);
                winner = message.senderUsername;
                looser = gameTarget;
            }
            if (user2Answer.toLowerCase() === 'pedra') {
                client.log.logAndReply(message, `${message.senderUsername} usou pedra 🪨 e ${gameTarget} usou pedra 🪨! É um empate!`);
            }
            break;
        case 'papel':
            if (user2Answer.toLowerCase() === 'tesoura') {
                client.log.logAndReply(message, `${message.senderUsername} usou papel 📄 e ${gameTarget} usou tesoura ✂️! ${gameTarget} é o vencedor! 🏆`);
                winner = gameTarget;
                looser = message.senderUsername;
            }
            if (user2Answer.toLowerCase() === 'pedra') {
                client.log.logAndReply(message, `${message.senderUsername} usou papel 📄 e ${gameTarget} usou pedra 🪨! ${message.senderUsername} é o vencedor! 🏆`);
                winner = message.senderUsername;
                looser = gameTarget;
            }
            if (user2Answer.toLowerCase() === 'papel') {
                client.log.logAndReply(message, `${message.senderUsername} usou papel 📄 e ${gameTarget} usou papel 📄! É um empate!`);
            }
            break;
        case 'tesoura':
            if (user2Answer.toLowerCase() === 'pedra') {
                client.log.logAndReply(message, `${message.senderUsername} usou tesoura ✂️ e ${gameTarget} usou pedra 🪨! ${gameTarget} é o vencedor! 🏆`);
                winner = gameTarget;
                looser = message.senderUsername;
            }
            if (user2Answer.toLowerCase() === 'papel') {
                client.log.logAndReply(message, `${message.senderUsername} usou tesoura ✂️ e ${gameTarget} usou papel 📄! ${message.senderUsername} é o vencedor! 🏆`);
                winner = message.senderUsername;
                looser = gameTarget;
            }
            if (user2Answer.toLowerCase() === 'tesoura') {
                client.log.logAndReply(message, `${message.senderUsername} usou tesoura ✂️ e ${gameTarget} usou tesoura ✂️! É um empate!`);
            }
            break;
        default:
            client.log.logAndReply(message, `Algo deu errado eu acho, tente novamente. Se o erro persistir, entre em contato com o @${process.env.DEV_USERNAME}`);
            // remove players names from pendingPlayers
            pendingPlayers = pendingPlayers.filter(player => player !== message.senderUsername && player !== gameTarget.toLowerCase());
            // this should never happen but xdd

            return;
    };

    // remove players names from pendingPlayers
    pendingPlayers = pendingPlayers.filter(player => player !== message.senderUsername && player !== gameTarget.toLowerCase());

    // update db
    if (winner === null || looser === null) {
        let user1Stats = await client.db.get('jokenpo', { userId: await message.senderUserID });
        let user2Stats = await client.db.get('jokenpo', { userId: await client.getUserID(gameTarget) });

        if (user1Stats.length === 0) {
            user1Stats = await createJokenpoBase(client, message.senderUsername);
        } else { user1Stats = user1Stats[0]; }
        if (user2Stats.length === 0) {
            user2Stats = await createJokenpoBase(client, gameTarget);
        } else { user2Stats = user2Stats[0]; }

        user1Stats.ties += 1;
        user2Stats.ties += 1;
        await client.db.update('jokenpo', { userId: await message.senderUserID }, { $set: { ties: user1Stats.ties } });
        await client.db.update('jokenpo', { userId: await client.getUserID(gameTarget) }, { $set: { ties: user2Stats.ties } });
        return;
    }

    let winnerStats = await client.db.get('jokenpo', { userId: await client.getUserID(winner) });
    let looserStats = await client.db.get('jokenpo', { userId: await client.getUserID(looser) });

    if (winnerStats.length === 0) {
        winnerStats = await createJokenpoBase(client, winner);
    } else { winnerStats = winnerStats[0]; }
    if (looserStats.length === 0) {
        looserStats = await createJokenpoBase(client, looser);
    } else { looserStats = looserStats[0]; }

    winnerStats.wins += 1;
    looserStats.losses += 1;
    await client.db.update('jokenpo', { userId: await client.getUserID(winner) }, { $set: { wins: winnerStats.wins } });
    await client.db.update('jokenpo', { userId: await client.getUserID(looser) }, { $set: { losses: looserStats.losses } });
    return;
}

jokenpoCommand.commandName = 'jokenpo';
jokenpoCommand.aliases = ['jokenpo', 'jokenpô', 'pedrapapeltesoura', 'ppt'];
jokenpoCommand.shortDescription = 'Escolha um adversário para um jogo de jokenpô';
jokenpoCommand.cooldown = 5000;
jokenpoCommand.whisperable = true;
jokenpoCommand.description = `Jogue uma partida de jokenpô com alguém do chat
A sua jogada deve ser enviada para o susurro do bot dentro de 30 segundos - pedra, papel ou tesoura

!Jokenpo show: Exibe estatísticas de jokenpo. Quando não mencionado um usuário, exibirá as estatísticas de quem realizou o comando.

!Jokenpo top: Exibe os 5 usuários com mais vitórias, derrotas ou empates. Use "!jokenpo top win/loss/tie" para escolher o que será usado para classificar os usuários`;

jokenpoCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/${jokenpoCommand.commandName}/${jokenpoCommand.commandName}.js`;

module.exports = {
    jokenpoCommand,
};
