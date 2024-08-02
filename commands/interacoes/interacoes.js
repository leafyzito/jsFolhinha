const { manageCooldown } = require("../../utils/manageCooldown.js");
const { randomInt, randomChoice } = require("../../utils/utils.js");
// TODO: getEmoteFromList

const abracoCommand = async (client, message) => {
    message.command = 'abraco';
    if (!manageCooldown(5000, 'channel', message.senderUsername, message.command)) return;

    if (message.messageText.split(' ').length === 1) {
        client.sendMessage(message.senderId, `Use o formato: ${message.commandPrefix}abraço <pessoa pra abraçar>`);
        return;
    }

    const hugTarget = message.messageText.split(' ')[1].replace(/^@/, '');

    if (hugTarget.toLowerCase() === message.senderUsername) {
        client.sendMessage(message.senderId, `Você estava se sentido carente e resolveu se abraçar a si mesmo 🤗`);
        return;
    }
    
    if (['folhinha', 'folhinhabot'].includes(hugTarget.toLowerCase())) {
        client.sendMessage(message.senderId, `peepoHappy 🌹`);
        return;
    }

    const hugs = [
        `${message.senderUsername} abraçou ${hugTarget} bem forte 🤗`,
        `${message.senderUsername} deu um abraço bem apertado em ${hugTarget} 🤗`,
        `${message.senderUsername} abraçou e quase explodiu ${hugTarget} 🤗`,
        `${message.senderUsername} abraçou ${hugTarget} bem forte 🤗`,
        `${message.senderUsername} abraçou e esmagou ${hugTarget} 🤗`,
        `${message.senderUsername} abraçou ${hugTarget} tão forte que foi parar ao espaço 🤗`,
    ];

    client.log.logAndReply(message, randomChoice(hugs));
};

const beijoCommand = async (client, message) => {
    message.command = 'beijo';
    if (!manageCooldown(5000, 'channel', message.senderUsername, message.command)) return;

    if (message.messageText.split(' ').length === 1) {
        client.sendMessage(message.senderId, `Use o formato: ${message.commandPrefix}beijo <pessoa pra beijar>`);
        return;
    }

    const kissTarget = message.messageText.split(' ')[1].replace(/^@/, '');

    if (kissTarget.toLowerCase() === message.senderUsername) {
        client.sendMessage(message.senderId, `Você estava se sentido carente e se beijou no espelho 😘`);
        return;
    }
    
    if (['folhinha', 'folhinhabot'].includes(kissTarget.toLowerCase())) {
        client.sendMessage(message.senderId, `peepoHappy 🌹`);
        return;
    }

    const kisses = [
        `${message.senderUsername} deu um beijo em ${kissTarget} 😘`,
        `${message.senderUsername} deu um beijo bem molhado em ${kissTarget} 😘`,
    ];

    client.log.logAndReply(message, randomChoice(kisses));
};

const bonkCommand = async (client, message) => {
    message.command = 'bonk';
    if (!manageCooldown(5000, 'channel', message.senderUsername, message.command)) return;

    if (message.messageText.split(' ').length === 1) {
        client.sendMessage(message.senderId, `Use o formato: ${message.commandPrefix}bonk <pessoa pra bonkar>`);
        return;
    }

    const bonkTarget = message.messageText.split(' ')[1].replace(/^@/, '');

    if (bonkTarget.toLowerCase() === message.senderUsername) {
        client.sendMessage(message.senderId, `Você estava bobinho e resolveu se bonkar na cabeça`);
        return;
    }
    
    if (['folhinha', 'folhinhabot'].includes(bonkTarget.toLowerCase())) {
        client.sendMessage(message.senderId, `Não me bate ow Stare`);
        return;
    }

    const bonk_strengh = randomInt(0, 100);

    if (bonk_strengh === 0) {
        client.log.logAndReply(message, `${message.senderUsername} tentou bonkar ${bonkTarget} mas acabou se auto-nocauteando (impacto de ${bonk_strengh}%) 🤕`);
        return;
    }

    else if (bonk_strengh <= 25) {
        client.log.logAndReply(message, `${message.senderUsername} deu um bonk com impacto de ${bonk_strengh}% em ${bonkTarget}, bem fraco 🤭`);
        return;
    }

    else if (bonk_strengh >= 80) {
        client.log.logAndReply(message, `${message.senderUsername} deu um bonk com impacto de ${bonk_strengh}% e nocauteou ${bonkTarget} 💫`);
        return;
    }

    else if (bonk_strengh === 100) {
        client.log.logAndReply(message, `${message.senderUsername} deu um bonk com impacto de ${bonk_strengh}% em ${bonkTarget}, sendo apagado da existência 💨`);
        return;
    }

    client.log.logAndReply(message, `${message.senderUsername} deu um bonk com impacto de ${bonk_strengh}% em ${bonkTarget} BOP`);
};

const tuckCommand = async (client, message) => {
    message.command = 'tuck';
    if (!manageCooldown(5000, 'channel', message.senderUsername, message.command)) return;

    if (message.messageText.split(' ').length === 1) {
        client.sendMessage(message.senderId, `Use o formato: ${message.commandPrefix}tuck <pessoa pra tuckar>`);
        return;
    }

    const tuckTarget = message.messageText.split(' ')[1].replace(/^@/, '');

    if (tuckTarget.toLowerCase() === message.senderUsername) {
        client.sendMessage(message.senderId, `Você não tinha ninguém para te pôr pra dormir, então você se auto-colocou pra dormir 💤`);
        return;
    }
    
    if (['folhinha', 'folhinhabot'].includes(tuckTarget.toLowerCase())) {
        client.sendMessage(message.senderId, `Valeu por me colocar pra dormir, mas preciso me manter acordado 😮‍💨`);
        return;
    }

    const tucks = [
        `${message.senderUsername} colocou ${tuckTarget} pra dormir peepoHappy 👉 🛏`,
        `${message.senderUsername} colocou ${tuckTarget} pra dormir com um cobertor bem quentinho 😴`,
        `${message.senderUsername} colocou ${tuckTarget} pra dormir e deu um beijinho na testa 💤`,
        `${message.senderUsername} colocou ${tuckTarget} pra dormir e cantou uma canção de ninar 🎶`,
        `${message.senderUsername} colocou ${tuckTarget} pra dormir e contou uma história de ninar 📖`,
    ];

    client.log.logAndReply(message, randomChoice(tucks));
};

const slapCommand = async (client, message) => {
    message.command = 'slap';
    if (!manageCooldown(5000, 'channel', message.senderUsername, message.command)) return;

    if (message.messageText.split(' ').length === 1) {
        client.sendMessage(message.senderId, `Use o formato: ${message.commandPrefix}slap <pessoa pra dar um tapa>`);
        return;
    }

    const slapTarget = message.messageText.split(' ')[1].replace(/^@/, '');

    if (slapTarget.toLowerCase() === message.senderUsername) {
        client.sendMessage(message.senderId, `Você deu um tapa em si mesmo 🤨`);
        return;
    }
    
    if (['folhinha', 'folhinhabot'].includes(slapTarget.toLowerCase())) {
        client.sendMessage(message.senderId, `MrDestructoid Por que você me bateu? Isso terá volta. Dorme de olho aberto, fique atento.`);
        return;
    }

    const slaps = [
        `${message.senderUsername} deu um tapa em ${slapTarget} 💢 😡`,
        `${message.senderUsername} deu um tapa bem forte em ${slapTarget} 💢 😡`,
        `${message.senderUsername} deu um tapa com as costas em ${slapTarget} 💢 😡`,
    ];

    client.log.logAndReply(message, randomChoice(slaps));
};

const explodeCommand = async (client, message) => {
    message.command = 'explode';
    if (!manageCooldown(5000, 'channel', message.senderUsername, message.command)) return;

    if (message.messageText.split(' ').length === 1) {
        client.sendMessage(message.senderId, `Use o formato: ${message.commandPrefix}explode <pessoa pra explodir>`);
        return;
    }

    const explodeTarget = message.messageText.split(' ')[1].replace(/^@/, '');

    if (explodeTarget.toLowerCase() === message.senderUsername) {
        client.sendMessage(message.senderId, `Você explodiu a si mesmo 💥🤨`);
        return;
    }
    
    if (['folhinha', 'folhinhabot'].includes(explodeTarget.toLowerCase())) {
        client.sendMessage(message.senderId, `MrDestructoid Boa tentativa, mas eu sou indestrutível`);
        return;
    }

    const explosions = [
        `${message.senderUsername} explodiu ${explodeTarget} 💥`,
        `${message.senderUsername} explodiu ${explodeTarget} em pedacinhos 💥`,
        `${message.senderUsername} jogou um bomba em ${explodeTarget} 💣💥`,
        `${message.senderUsername} jogou uma dinamite em ${explodeTarget} 🧨💥`,
    ];

    client.log.logAndReply(message, randomChoice(explosions));
};

module.exports = {
    abracoCommand,
    abracoAliases: ['abraco', 'abraço', 'abracar', 'abraçar', 'hug'],
    beijoCommand,
    beijoAliases: ['beijo', 'beijar', 'kiss'],
    bonkCommand,
    bonkAliases: ['bonk'],
    tuckCommand,
    tuckAliases: ['tuck'],
    slapCommand,
    slapAliases: ['slap', 'tapa'],
    explodeCommand,
    explodeAliases: ['explodir', 'explode', 'bomb'],
};
