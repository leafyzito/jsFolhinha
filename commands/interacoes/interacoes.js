const { processCommand } = require("../../utils/processCommand.js");
const { randomInt, randomChoice } = require("../../utils/utils.js");

const abracoCommand = async (client, message) => {
    message.command = 'abraco';
    if (!await processCommand(5000, 'channel', message, client)) return;

    if (message.messageText.split(' ').length === 1) {
        client.log.logAndReply(message, `Use o formato: ${message.commandPrefix}abraço <pessoa pra abraçar>`);
        return;
    }

    const hugTarget = message.messageText.split(' ')[1].replace(/^@/, '');

    if (hugTarget.toLowerCase() === message.senderUsername) {
        client.log.logAndReply(message, `Você estava se sentido carente e resolveu se abraçar a si mesmo 🤗`);
        return;
    }

    if (['folhinha', 'folhinhabot'].includes(hugTarget.toLowerCase())) {
        const emote = await client.emotes.getEmoteFromList(message.channelName, ['cathug', 'dankhug', 'hugs'], 'peepoHappy 🌹');
        client.log.logAndReply(message, emote);
        return;
    }

    const emote = await client.emotes.getEmoteFromList(message.channelName, ['cathug', 'dankhug', 'hugs'], '🤗');
    const hugs = [
        `${message.senderUsername} abraçou ${hugTarget} bem forte ${emote}`,
        `${message.senderUsername} deu um abraço bem apertado em ${hugTarget} ${emote}`,
        `${message.senderUsername} abraçou e quase explodiu ${hugTarget} ${emote}`,
        `${message.senderUsername} abraçou ${hugTarget} bem forte ${emote}`,
        `${message.senderUsername} abraçou e esmagou ${hugTarget} ${emote}`,
        `${message.senderUsername} abraçou ${hugTarget} tão forte que foi parar ao espaço ${emote}`,
    ];

    client.log.logAndReply(message, randomChoice(hugs));
};

const beijoCommand = async (client, message) => {
    message.command = 'beijo';
    if (!await processCommand(5000, 'channel', message, client)) return;

    if (message.messageText.split(' ').length === 1) {
        client.log.logAndReply(message, `Use o formato: ${message.commandPrefix}beijo <pessoa pra beijar>`);
        return;
    }

    const kissTarget = message.messageText.split(' ')[1].replace(/^@/, '');

    if (kissTarget.toLowerCase() === message.senderUsername) {
        client.log.logAndReply(message, `Você estava se sentido carente e se beijou no espelho 😘`);
        return;
    }

    if (['folhinha', 'folhinhabot'].includes(kissTarget.toLowerCase())) {
        client.log.logAndReply(message, `peepoHappy 🌹`);
        return;
    }

    const emote = await client.emotes.getEmoteFromList(message.channelName, ['kiss', 'kissahomie', 'catkiss', 'beijao'], '😘');
    const kisses = [
        `${message.senderUsername} deu um beijo em ${kissTarget} ${emote}`,
        `${message.senderUsername} deu um beijo bem molhado em ${kissTarget} ${emote}`,
    ];

    client.log.logAndReply(message, randomChoice(kisses));
};

const bonkCommand = async (client, message) => {
    message.command = 'bonk';
    if (!await processCommand(5000, 'channel', message, client)) return;

    if (message.messageText.split(' ').length === 1) {
        client.log.logAndReply(message, `Use o formato: ${message.commandPrefix}bonk <pessoa pra bonkar>`);
        return;
    }

    const bonkTarget = message.messageText.split(' ')[1].replace(/^@/, '');

    if (bonkTarget.toLowerCase() === message.senderUsername) {
        const emote = await client.emotes.getEmoteFromList(message.channelName, ['leledacuca', 'biruta']);
        client.log.logAndReply(message, `Você estava se sentindo bobinho e resolveu se bonkar na cabeça ${emote}`);
        return;
    }

    if (['folhinha', 'folhinhabot'].includes(bonkTarget.toLowerCase())) {
        client.log.logAndReply(message, `Não me bate ow Stare`);
        return;
    }

    const bonkStrengh = randomInt(0, 100);

    if (bonkStrengh === 0) {
        const emote = await client.emotes.getEmoteFromList(message.channelName, ['pfff', 'pffff', 'porvalo', 'mock', 'pointandlaugh'], '🤭');
        client.log.logAndReply(message, `${message.senderUsername} tentou bonkar ${bonkTarget} mas acabou se auto-nocauteando (impacto de ${bonkStrengh}%) ${emote}`);
        return;
    }

    else if (bonkStrengh <= 25) {
        client.log.logAndReply(message, `${message.senderUsername} deu um bonk com impacto de ${bonkStrengh}% em ${bonkTarget}, bem fraco 🤭`);
        return;
    }

    else if (bonkStrengh >= 80) {
        client.log.logAndReply(message, `${message.senderUsername} deu um bonk com impacto de ${bonkStrengh}% e nocauteou ${bonkTarget} 💫`);
        return;
    }

    else if (bonkStrengh === 100) {
        const emote = await client.emotes.getEmoteFromList(message.channelName, ['peepopoof', 'pppoof', 'pepepoof'], '💨');
        client.log.logAndReply(message, `${message.senderUsername} deu um bonk com impacto de ${bonkStrengh}% em ${bonkTarget}, sendo apagado da existência ${emote}`);
        return;
    }

    const emote = await client.emotes.getEmoteFromList(message.channelName, ['bonking', 'yaebonk', 'bonked', 'bonkcat', 'donkbonk'], 'BOP')
    client.log.logAndReply(message, `${message.senderUsername} deu um bonk com impacto de ${bonkStrengh}% em ${bonkTarget} ${emote}`);
};

const tuckCommand = async (client, message) => {
    message.command = 'tuck';
    if (!await processCommand(5000, 'channel', message, client)) return;

    if (message.messageText.split(' ').length === 1) {
        client.log.logAndReply(message, `Use o formato: ${message.commandPrefix}tuck <pessoa pra tuckar>`);
        return;
    }

    const tuckTarget = message.messageText.split(' ')[1].replace(/^@/, '');

    if (tuckTarget.toLowerCase() === message.senderUsername) {
        client.log.logAndReply(message, `Você não tinha ninguém para te pôr pra dormir, então você se auto-colocou pra dormir 💤`);
        return;
    }

    if (['folhinha', 'folhinhabot'].includes(tuckTarget.toLowerCase())) {
        const emote = await client.emotes.getEmoteFromList(message.channelName, ['wokege'], '😮‍💨');
        client.log.logAndReply(message, `Valeu por me colocar pra dormir, mas preciso me manter acordado ${emote}`);
        return;
    }

    const emote = await client.emotes.getEmoteFromList(message.channelName, ['tuckk', 'tuckahomie', 'tuck', 'banoit'], '💤');
    const tucks = [
        `${message.senderUsername} colocou ${tuckTarget} pra dormir ${emote}`,
        `${message.senderUsername} colocou ${tuckTarget} pra dormir com um cobertor bem quentinho ${emote}`,
        `${message.senderUsername} colocou ${tuckTarget} pra dormir e deu um beijinho na testa ${emote}`,
        `${message.senderUsername} colocou ${tuckTarget} pra dormir e cantou uma canção de ninar ${emote}`,
        `${message.senderUsername} colocou ${tuckTarget} pra dormir e contou uma história de ninar ${emote}`,
    ];

    client.log.logAndReply(message, randomChoice(tucks));
};

const slapCommand = async (client, message) => {
    message.command = 'slap';
    if (!await processCommand(5000, 'channel', message, client)) return;

    if (message.messageText.split(' ').length === 1) {
        client.log.logAndReply(message, `Use o formato: ${message.commandPrefix}slap <pessoa pra dar um tapa>`);
        return;
    }

    const slapTarget = message.messageText.split(' ')[1].replace(/^@/, '');

    if (slapTarget.toLowerCase() === message.senderUsername) {
        const emote = await client.emotes.getEmoteFromList(message.channelName, ['leledacuca', 'biruta', 'eeeh', 'peepopiolho'], '🤨');
        client.log.logAndReply(message, `Você deu um tapa em si mesmo ${emote}`);
        return;
    }

    if (['folhinha', 'folhinhabot'].includes(slapTarget.toLowerCase())) {
        client.log.logAndReply(message, `MrDestructoid Por que você me bateu? Isso terá volta. Dorme de olho aberto, fique atento.`);
        return;
    }

    const emote = await client.emotes.getEmoteFromList(message.channelName, ['catslap', 'elisslap'], '💢😡');
    const slaps = [
        `${message.senderUsername} deu um tapa em ${slapTarget} ${emote}`,
        `${message.senderUsername} deu um tapa bem forte em ${slapTarget} ${emote}`,
        `${message.senderUsername} deu um tapa com as costas da mão em ${slapTarget} ${emote}`,
    ];

    client.log.logAndReply(message, randomChoice(slaps));
};

const explodeCommand = async (client, message) => {
    message.command = 'explode';
    if (!await processCommand(5000, 'channel', message, client)) return;

    if (message.messageText.split(' ').length === 1) {
        client.log.logAndReply(message, `Use o formato: ${message.commandPrefix}explode <pessoa pra explodir>`);
        return;
    }

    const explodeTarget = message.messageText.split(' ')[1].replace(/^@/, '');

    if (explodeTarget.toLowerCase() === message.senderUsername) {
        const emote = await client.emotes.getEmoteFromList(message.channelName, ['leledacuca', 'biruta', 'eeeh', 'peepopiolho'], '💥🤨');
        client.log.logAndReply(message, `Você explodiu a si mesmo ${emote}`);
        return;
    }

    if (['folhinha', 'folhinhabot'].includes(explodeTarget.toLowerCase())) {
        client.log.logAndReply(message, `MrDestructoid Boa tentativa, mas eu sou indestrutível`);
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

abracoCommand.commandName = 'abraco';
abracoCommand.aliases = ['abraco', 'abraço', 'abracar', 'abraçar', 'hug'];
abracoCommand.shortDescription = 'Dá um abraço em alguém no chat';
abracoCommand.cooldown = 5000;
abracoCommand.whisperable = false;
abracoCommand.description = 'Uso: !abraco <pessoa>; Resposta esperada: uma mensagem de abraço direcionada à pessoa mencionada';
abracoCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/interacoes/interacoes.js`;

beijoCommand.commandName = 'beijo';
beijoCommand.aliases = ['beijo', 'beijar', 'kiss'];
beijoCommand.shortDescription = 'Dá um beijo em alguém no chat';
beijoCommand.cooldown = 5000;
beijoCommand.whisperable = false;
beijoCommand.description = 'Uso: !beijo <pessoa>; Resposta esperada: uma mensagem de beijo direcionada à pessoa mencionada';
beijoCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/interacoes/interacoes.js`;

bonkCommand.commandName = 'bonk';
bonkCommand.aliases = ['bonk'];
bonkCommand.shortDescription = 'Dá um bonk em alguém no chat';
bonkCommand.cooldown = 5000;
bonkCommand.whisperable = false;
bonkCommand.description = 'Uso: !bonk <pessoa>; Resposta esperada: uma mensagem de bonk direcionada à pessoa mencionada';
bonkCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/interacoes/interacoes.js`;

tuckCommand.commandName = 'tuck';
tuckCommand.aliases = ['tuck'];
tuckCommand.shortDescription = 'Coloca alguém para dormir no chat';
tuckCommand.cooldown = 5000;
tuckCommand.whisperable = false;
tuckCommand.description = 'Uso: !tuck <pessoa>; Resposta esperada: uma mensagem dizendo que a pessoa mencionada foi colocada para dormir';
tuckCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/interacoes/interacoes.js`;

slapCommand.commandName = 'slap';
slapCommand.aliases = ['slap', 'tapa'];
slapCommand.shortDescription = 'Dá um tapa em alguém no chat';
slapCommand.cooldown = 5000;
slapCommand.whisperable = false;
slapCommand.description = 'Uso: !slap <pessoa>; Resposta esperada: uma mensagem de tapa direcionada à pessoa mencionada';
slapCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/interacoes/interacoes.js`;

explodeCommand.commandName = 'explode';
explodeCommand.aliases = ['explode', 'explodir', 'bomb'];
explodeCommand.shortDescription = 'Explode alguém no chat';
slapCommand.cooldown = 5000;
slapCommand.whisperable = false;
slapCommand.description = 'Uso: !slap <pessoa>; Resposta esperada: uma mensagem de tapa direcionada à pessoa mencionada';
slapCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/interacoes/interacoes.js`;

explodeCommand.commandName = 'explode';
explodeCommand.aliases = ['explode', 'explodir', 'bomb'];
explodeCommand.cooldown = 5000;
explodeCommand.whisperable = false;
explodeCommand.description = 'Uso: !explode <pessoa>; Resposta esperada: uma mensagem de explosão direcionada à pessoa mencionada';
explodeCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/interacoes/interacoes.js`;


module.exports = {
    abracoCommand,
    beijoCommand,
    bonkCommand,
    tuckCommand,
    slapCommand,
    explodeCommand,
};
