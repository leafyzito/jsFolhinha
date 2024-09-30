const { processCommand, resetCooldown } = require("../../utils/processCommand.js");
const { waitForMessage, randomChoice, randomInt, capitalize } = require("../../utils/utils.js");
const fs = require('fs');
const path = require('path');

const dungeonFilePath = path.join(__dirname, 'dungeon.json');
const dungeonData = (() => {
    try {
        return JSON.parse(fs.readFileSync(dungeonFilePath, 'utf8'));
    } catch (err) {
        console.error("Error reading dungeon.json:", err);
        return null;
    }
})();

// User-specific dungeon base creation remains unchanged
async function createUserDungeonBase(client, message) {
    const insert_doc = {
        userId: message.senderUserID,
        username: message.senderUsername,
        xp: 0,
        level: 1,
        wins: 0,
        losses: 0
    };

    await client.db.insert('dungeon', insert_doc);
    return insert_doc;
}

async function loadUserDungeonStats(client, message) {
    const userDungeonStats = await client.db.get('dungeon', { userId: message.senderUserID });
    if (userDungeonStats.length === 0) {
        return await createUserDungeonBase(client, message);
    }

    return userDungeonStats[0];
}

const dungeonCommand = async (client, message) => {
    message.command = 'dungeon';
    if (!await processCommand(30_000, 'user', message, client)) return;

    if (message.messageText.split(' ').length !== 1) {
        const userOption = message.messageText.split(' ')[1].toLowerCase();
        const targetUser = message.messageText.split(' ')[2]?.replace(/^@/, '') || message.senderUsername;
        const targetId = targetUser.toLowerCase() === message.senderUsername ? message.senderUserID : await client.getUserID(targetUser);
        if (['show', 'stats', 'mostrar', 'level', 'lvl'].includes(userOption)) {
            let userDungeonStats = await client.db.get('dungeon', { userId: targetId });
            if (userDungeonStats.length === 0) {
                client.log.logAndReply(message, `${targetUser} ainda não explorou nenhuma dungeon`);
                resetCooldown(message.senderUsername, 'user', message.command, 30_000, 5_000);
                return;
            }

            userDungeonStats = userDungeonStats[0];
            const winrate = userDungeonStats.wins / (userDungeonStats.wins + userDungeonStats.losses) * 100;
            await client.log.reply(message, `${targetUser} tem ${userDungeonStats.xp} XP 🌟 está no level ${userDungeonStats.level} com ${userDungeonStats.wins + userDungeonStats.losses} dungeons ⚔️ (${userDungeonStats.wins} vitórias e ${userDungeonStats.losses} derrotas - ${winrate.toFixed(2)}% winrate)`);
            resetCooldown(message.senderUsername, 'user', message.command, 30_000, 5_000);
            return;
        }

        if (['top', 'ranking', 'rank', 'leaderboard', 'lb'].includes(userOption)) {
            let rankOption = message.messageText.split(' ')[2]?.toLowerCase() || 'xp';
            if (!['xp', 'level', 'lvl', 'win', 'wins', 'loss', 'losses'].includes(rankOption)) { return; }
            let ranking = await client.db.get('dungeon', {});
            ranking.sort((a, b) => {
                if (rankOption === 'xp') {
                    return b.xp - a.xp;
                } else if (['level', 'lvl'].includes(rankOption)) {
                    rankOption = 'level';
                    return b.level - a.level;
                } else if (['win', 'wins'].includes(rankOption)) {
                    rankOption = 'wins';
                    return b.wins - a.wins;
                } else if (['loss', 'losses'].includes(rankOption)) {
                    rankOption = 'losses';
                    return b.losses - a.losses;
                }
            });

            const top5 = ranking.slice(0, 5);
            let reply = `Top 5 ${rankOption}: `;
            for (let i = 0; i < top5.length; i++) {
                const username = await client.getUserByUserID(top5[i].userId);
                reply += `${i + 1}º ${username}: (${top5[i][rankOption]})`;
                if (i !== top5.length - 1) {
                    reply += ', ';
                }
            }
            await client.log.logAndReply(message, reply + '⚔️');
            resetCooldown(message.senderUsername, 'user', message.command, 30_000, 5_000);
            return;
        }
    }

    const userDungeonStats = await loadUserDungeonStats(client, message);

    const check = {
        senderUserID: message.senderUserID,
        senderUsername: message.senderUsername,
        channelName: message.channelName,
        content: ['1', '2', `${message.commandPrefix}1`, `${message.commandPrefix}2`, `${message.commandPrefix}d 1`, `${message.commandPrefix}d 2`, `${message.commandPrefix}dungeon 1`, `${message.commandPrefix}dungeon 2`]
    };

    const dungeon = dungeonData[Math.floor(Math.random() * dungeonData.length)];
    await client.log.reply(message, `${capitalize(dungeon.quote)} você quer ${dungeon['1'].option} ou ${dungeon['2'].option}? (1 ou 2)`);
    const response = await waitForMessage(client, check, 10_000);
    if (!response) { return; } // end it here if no response

    // choose a random dungeon
    let resMessage = response.messageText.replace(message.commandPrefix, '');
    const userOption = resMessage.toLowerCase().replace('d', '');
    console.log(resMessage, userOption);

    const result = randomInt(1, 2) == 1 ? 'win' : 'lose';
    if (result === 'win') {
        const experienceGain = Math.floor(randomInt(50, 75) + 2 * Math.pow(userDungeonStats.level, 1.2));
        const experienceNeededForLvlUp = 100 * userDungeonStats.level + 25 * (userDungeonStats.level * (userDungeonStats.level + 1) / 2);
        // const xpForNextLevel = experienceNeededForLvlUp - userDungeonStats.xp;
        // console.log('xp para o proximo lvl: ', xpForNextLevel);

        if (userDungeonStats.xp + experienceGain > experienceNeededForLvlUp) {
            await client.db.update('dungeon', { userId: message.senderUserID }, { $inc: { xp: experienceGain, wins: 1, level: 1 } });
            await client.log.logAndReply(message, `${capitalize(dungeon[userOption][result])}! [+${experienceGain} ⇒ ${userDungeonStats.xp + experienceGain} XP] ⬆ subiu para o nível ${userDungeonStats.level + 1}`);
        } else {
            await client.db.update('dungeon', { userId: message.senderUserID }, { $inc: { xp: experienceGain, wins: 1 } });
            await client.log.logAndReply(message, `${capitalize(dungeon[userOption][result])}! [+${experienceGain} ⇒ ${userDungeonStats.xp + experienceGain} XP]`);
        }
    } else {
        let experienceLoss = Math.floor(randomInt(10, 30) + 0.5 * userDungeonStats.level + Math.pow(userDungeonStats.level, 0.5));
        if (userDungeonStats.xp - experienceLoss <= 0) {
            experienceLoss = userDungeonStats.xp;
        }
        await client.db.update('dungeon', { userId: message.senderUserID }, { $inc: { losses: 1 }, $set: { xp: userDungeonStats.xp - experienceLoss } });
        await client.log.logAndReply(message, `${capitalize(dungeon[userOption][result])}! [-${experienceLoss} ⇒ ${userDungeonStats.xp - experienceLoss} XP]`);
    }

    return;
};

const fastDungeonCommand = async (client, message) => {
    message.command = 'dungeon';
    if (!await processCommand(30_000, 'user', message, client)) return;

    const userDungeonStats = await loadUserDungeonStats(client, message);

    const dungeon = dungeonData[Math.floor(Math.random() * dungeonData.length)];

    const option = randomChoice(['1', '2']);
    const result = randomInt(1, 2) == 1 ? 'win' : 'lose';
    let responseMessage = `${capitalize(dungeon.quote)} Você decide ${dungeon[option].option} e `;

    if (result === 'win') {
        const experienceGain = Math.floor(randomInt(50, 75) + 2 * Math.pow(userDungeonStats.level, 1.2));
        const experienceNeededForLvlUp = 100 * userDungeonStats.level + 25 * (userDungeonStats.level * (userDungeonStats.level + 1) / 2);

        if (userDungeonStats.xp + experienceGain >= experienceNeededForLvlUp) {
            await client.db.update('dungeon', { userId: message.senderUserID }, { $inc: { xp: experienceGain, wins: 1, level: 1 } });
            responseMessage += `${dungeon[option][result]}! [+${experienceGain} ⇒ ${userDungeonStats.xp + experienceGain} XP] ⬆ subiu para o nível ${userDungeonStats.level + 1}`;
        } else {
            await client.db.update('dungeon', { userId: message.senderUserID }, { $inc: { xp: experienceGain, wins: 1 } });
            responseMessage += `${dungeon[option][result]}! [+${experienceGain} ⇒ ${userDungeonStats.xp + experienceGain} XP]`;
        }
    } else {
        let experienceLoss = Math.floor(randomInt(10, 30) + 0.5 * userDungeonStats.level + Math.pow(userDungeonStats.level, 0.5));
        if (userDungeonStats.xp - experienceLoss <= 0) {
            experienceLoss = userDungeonStats.xp;
        }
        await client.db.update('dungeon', { userId: message.senderUserID }, { $inc: { losses: 1 }, $set: { xp: userDungeonStats.xp - experienceLoss } });
        responseMessage += `${dungeon[option][result]}! [-${experienceLoss} ⇒ ${userDungeonStats.xp - experienceLoss} XP]`;
    }

    await client.log.logAndReply(message, responseMessage);
    return;
};

dungeonCommand.commandName = 'dungeon';
dungeonCommand.aliases = ['dungeon', 'd'];
dungeonCommand.shortDescription = 'Entre em uma dungeon e escolha o seu destino';
dungeonCommand.cooldown = 30_000;
dungeonCommand.whisperable = true;
dungeonCommand.description = `Você entrará em uma dungeon aleatória e poderá escolher entre 2 destinos, sendo que apenas 1 deles lhe dará XP
A sua escolha é feita ao mandar "1" ou "2" no chat quando o bot lhe apresentar a dungeon

!Dungeon show: Exibe estatísticas de dungeon. Quando não mencionado um usuário, exibirá as estatísticas de quem realizou o comando.

!Dungeon top: Exibe os 5 usuários com mais XP, nível, vitórias ou derrotas. Use "!dungeon top xp/level/win/loss" para escolher o que será usado para classificar os usuários

O XP ganho depende do nível que você atingiu, e é calculado assim:
XP = 50~75 + 3 * Nível do player

O XP necessário para subir de nível é calculado assim:
XP necessário para subir de nível = 100 * Nível do player + 25 * (Nível do player * (Nível do player + 1) / 2)

O XP perdido é calculado assim:
XP perdido = 25~50 * Nível do player`;
dungeonCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/${dungeonCommand.commandName}/${dungeonCommand.commandName}.js`;

fastDungeonCommand.commandName = 'fastdungeon';
fastDungeonCommand.aliases = ['fastdungeon', 'fd'];
fastDungeonCommand.shortDescription = 'Entre em uma dungeon e tenha o seu destino escolhido aleatoriamente';
fastDungeonCommand.cooldown = 30_000;
fastDungeonCommand.whisperable = true;
fastDungeonCommand.description = `Você entrará em uma dungeon aleatória e terá um destino aleatório

O XP ganho depende do nível que você atingiu, e é calculado assim:
XP = 50~75 + 3 * Nível do player

O XP necessário para subir de nível é calculado assim:
XP necessário para subir de nível = 100 * Nível do player + 25 * (Nível do player * (Nível do player + 1) / 2)

O XP perdido é calculado assim:
XP perdido = 25~50 * Nível do player`;
fastDungeonCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/${fastDungeonCommand.commandName}/${fastDungeonCommand.commandName}.js`;

module.exports = {
    dungeonCommand,
    fastDungeonCommand,
};