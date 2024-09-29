const { processCommand } = require("../../utils/processCommand.js");
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
    if (!await processCommand(30_000, 'channel', message, client)) return;

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

    const result = randomInt(1, 3) <= 2 ? 'win' : 'lose';
    if (result === 'win') {
        const experience = Math.floor(randomInt(50, 75) + 3 * userDungeonStats.level);
        const experienceNeededForLvlUp = 100 * userDungeonStats.level + 25 * (userDungeonStats.level * (userDungeonStats.level + 1) / 2);
        // const xpForNextLevel = experienceNeededForLvlUp - userDungeonStats.xp;
        // console.log('xp para o proximo lvl: ', xpForNextLevel);

        if (userDungeonStats.xp + experience > experienceNeededForLvlUp) {
            await client.db.update('dungeon', { userId: message.senderUserID }, { $inc: { xp: experience, wins: 1, level: 1 } });
            await client.log.logAndReply(message, `${capitalize(dungeon[userOption][result])}! [+${experience} ⇒ ${userDungeonStats.xp + experience} XP]  e e subiu para o nível ${userDungeonStats.level + 1}`);
        } else {
            await client.db.update('dungeon', { userId: message.senderUserID }, { $inc: { xp: experience, wins: 1 } });
            await client.log.logAndReply(message, `${capitalize(dungeon[userOption][result])}! [+${experience} ⇒ ${userDungeonStats.xp + experience} XP]`);
        }
    } else {
        await client.db.update('dungeon', { userId: message.senderUserID }, { $inc: { losses: 1 } });
        await client.log.logAndReply(message, `${capitalize(dungeon[userOption][result])}! [+0 ⇒ ${userDungeonStats.xp} XP]`);
    }

    return;
};

const fastDungeonCommand = async (client, message) => {
    message.command = 'dungeon';
    if (!await processCommand(30_000, 'channel', message, client)) return;

    const userDungeonStats = await loadUserDungeonStats(client, message);

    const dungeon = dungeonData[Math.floor(Math.random() * dungeonData.length)];

    const option = randomChoice(['1', '2']);
    const result = randomInt(1, 3) <= 2 ? 'win' : 'lose';
    let responseMessage = `${capitalize(dungeon.quote)} Você decide ${dungeon[option].option} e `;

    if (result === 'win') {
        const experience = Math.floor(randomInt(50, 75) + 3 * userDungeonStats.level);
        const experienceNeededForLvlUp = 100 * userDungeonStats.level + 25 * (userDungeonStats.level * (userDungeonStats.level + 1) / 2);

        if (userDungeonStats.xp + experience >= experienceNeededForLvlUp) {
            await client.db.update('dungeon', { userId: message.senderUserID }, { $inc: { xp: experience, wins: 1, level: 1 } });
            responseMessage += `${dungeon[option][result]}! [+${experience} ⇒ ${userDungeonStats.xp + experience} XP] e e subiu para o nível ${userDungeonStats.level + 1}`;
        } else {
            await client.db.update('dungeon', { userId: message.senderUserID }, { $inc: { xp: experience, wins: 1 } });
            responseMessage += `${dungeon[option][result]}! [+${experience} ⇒ ${userDungeonStats.xp + experience} XP]`;
        }
    } else {
        await client.db.update('dungeon', { userId: message.senderUserID }, { $inc: { losses: 1 } });
        responseMessage += `${dungeon[option][result]}! [+0 ⇒ ${userDungeonStats.xp} XP]`;
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

O XP ganho depende do nível que você atingiu, e é calculado assim:
XP = 50~75 + 3 * Nível do player

E o XP necessário para subir de nível é calculado assim:
XP necessário para subir de nível = 100 * Nível do player + 25 * (Nível do player * (Nível do player + 1) / 2)`;
dungeonCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/${dungeonCommand.commandName}/${dungeonCommand.commandName}.js`;

fastDungeonCommand.commandName = 'fastdungeon';
fastDungeonCommand.aliases = ['fastdungeon', 'fd'];
fastDungeonCommand.shortDescription = 'Entre em uma dungeon e tenha o seu destino escolhido aleatoriamente';
fastDungeonCommand.cooldown = 30_000;
fastDungeonCommand.whisperable = true;
fastDungeonCommand.description = `Você entrará em uma dungeon aleatória e terá um destino aleatório

O XP ganho depende do nível que você atingiu, e é calculado assim:
XP = 50~75 + 3 * Nível do player

E o XP necessário para subir de nível é calculado assim:
XP necessário para subir de nível = 100 * Nível do player + 25 * (Nível do player * (Nível do player + 1) / 2)`;
fastDungeonCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/${fastDungeonCommand.commandName}/${fastDungeonCommand.commandName}.js`;

module.exports = {
    dungeonCommand,
    fastDungeonCommand,
};