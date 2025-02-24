const { processCommand } = require("../../utils/processCommand.js");
const { timeSince } = require("../../utils/utils.js");
const { afkInfoObjects } = require('./afk_info_model.js');

var afkAliasList = [];

afkInfoObjects.forEach(afk => {
    afkAliasList = afkAliasList.concat(afk.alias);
});


const afkCommand = async (client, message) => {
    message.command = 'afk';
    if (!await processCommand(5000, 'user', message, client)) return;

    const commandInvoker = message.messageText.split(' ')[0].split(`${message.commandPrefix}`)[1].trim().toLowerCase();
    const afkInfoObject = afkInfoObjects.find(afk => afk.alias.includes(commandInvoker));
    const afkStats = await client.db.get('afk', { channel: message.channelName, user: message.senderUsername });

    if (afkStats.length === 0) {
        const insert_base_afk_doc = {
            channel: message.channelName,
            user: message.senderUsername,
            is_afk: false,
            afk: afkInfoObject.afk,
            afk_message: null,
            afk_since: 0,
            afk_return: 0,
            afk_type: null,
            rafk_counter: 0
        };

        await client.db.insert('afk', insert_base_afk_doc);
    }

    var afkMessage = message.messageText.split(' ').slice(1).join(' ');
    if (afkMessage.length > 400) {
        afkMessage = afkMessage.slice(0, 400) + '...';
    }

    const afkType = afkInfoObject.alias[0];
    const afkAction = afkInfoObject.afk;
    const afkEmoji = afkInfoObject.emoji;

    client.log.logAndReply(message, `${message.senderUsername} ${afkAction} ${afkEmoji} ${afkMessage ? `: ${afkMessage}` : ''}`);
    await client.db.update('afk', { channel: message.channelName, user: message.senderUsername },
        {
            $set: {
                is_afk: true,
                afk_message: afkMessage,
                afk_since: Math.floor(Date.now() / 1000),
                afk_type: afkType,
                rafk_counter: 0
            }
        });
    // client.reloadAfkUsers();
    // add user to client.afkUsers
    if (!client.afkUsers[message.channelName]) {
        client.afkUsers[message.channelName] = [];
    }
    client.afkUsers[message.channelName].push(message.senderUsername);
    return;
};

const rafkCommand = async (client, message) => {
    message.command = 'rafk';
    if (!await processCommand(5000, 'channel', message, client)) return;

    var afkStats = await client.db.get('afk', { channel: message.channelName, user: message.senderUsername });

    if (afkStats.length === 0) {
        client.log.logAndReply(message, `Você nunca esteve afk aqui antes`);
        return;
    }
    afkStats = afkStats[0];

    const currentTime = Math.floor(Date.now() / 1000);
    var deltaTime = currentTime - afkStats.afk_return;
    if (deltaTime > 300) {
        client.log.logAndReply(message, `Já se passaram mais de 5 minutos desde que você voltou`);
        return;
    }

    if (afkStats.rafk_counter >= 4) { return; }
    if (afkStats.rafk_counter >= 3) {
        client.log.logAndReply(message, `Você só pode usar o comando ${message.commandPrefix}rafk 3 vezes seguidas`);
        await client.db.update('afk', { channel: message.channelName, user: message.senderUsername }, { $set: { rafk_counter: afkStats.rafk_counter + 1 } });
        return;
    }

    const afkInfoObject = afkInfoObjects.find(afk => afk.alias.includes(afkStats.afk_type));
    const afkAction = afkInfoObject.rafk;
    const afkEmoji = afkInfoObject.emoji;

    client.log.logAndReply(message, `${message.senderUsername} voltou ${afkAction} ${afkEmoji} ${afkStats.afk_message ? `: ${afkStats.afk_message}` : ''}`);
    await client.db.update('afk', { channel: message.channelName, user: message.senderUsername }, { $set: { is_afk: true, rafk_counter: afkStats.rafk_counter + 1 } });
    // client.reloadAfkUsers();
    // add user to client.afkUsers
    if (!client.afkUsers[message.channelName]) {
        client.afkUsers[message.channelName] = [];
    }
    client.afkUsers[message.channelName].push(message.senderUsername);
    return;
};

const isAfkCommand = async (client, message) => {
    message.command = 'isafk';
    if (!await processCommand(5000, 'channel', message, client)) return;

    if (message.messageText.split(' ').length === 1) {
        client.log.logAndReply(message, `Use o formato: ${message.commandPrefix}isafk <usuário>`);
        return;
    }

    const isAfkTarget = message.messageText.split(' ')[1]?.replace(/^@/, '').toLowerCase();

    var afkStats = await client.db.get('afk', { channel: message.channelName, user: isAfkTarget });
    if (afkStats.length === 0) {
        client.log.logAndReply(message, `${isAfkTarget} nunca esteve afk aqui antes`);
        return;
    }

    afkStats = afkStats[0];
    if (!afkStats.is_afk) {
        client.log.logAndReply(message, `${isAfkTarget} não está afk`);
        return;
    }

    const afkInfoObject = afkInfoObjects.find(afk => afk.alias.includes(afkStats.afk_type));
    const afkAction = afkInfoObject.isafk;
    const afkEmoji = afkInfoObject.emoji;
    const afkMessage = afkStats.afk_message;
    var afkSince = timeSince(afkStats.afk_since);

    client.log.logAndReply(message, `${isAfkTarget} está ${afkAction} ${afkEmoji} há ${afkSince} ⌛ ${afkMessage ? `: ${afkMessage}` : ''}`);
    return;
};

afkCommand.commandName = 'afk';
afkCommand.aliases = [...afkAliasList];
afkCommand.shortDescription = 'Fique com status afk para contar quanto tempo esteve fora no canal atual';
afkCommand.cooldown = 5000;
afkCommand.whisperable = false;
afkCommand.description = `Registra seu status como AFK no canal onde o comando foi realizado. Após você enviar qualquer mensagem no canal ficou AFK, o Folhinha responderá indicando quanto tempo você esteve ausente juntamente com a sua mensagem, caso tenha deixado uma

Esse comando não afetará seu estado de AFK em outros canais

Além de AFK, você poderá escolher entre uma variedade de ações, como !ler ou !desenhar, que terão o mesmo efeito do AFK, mas com uma mensagem diferente.

Nos aliases do comando poderá ver todas as opções de ações disponíveis`;
afkCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/${afkCommand.commandName}/${afkCommand.commandName}.js`;

rafkCommand.commandName = 'resumeafk';
rafkCommand.aliases = ['rafk', 'resumeafk'];
rafkCommand.shortDescription = 'Retome o seu status afk anterior no canal atual';
rafkCommand.cooldown = 5000;
rafkCommand.whisperable = false;
rafkCommand.description = `Para o caso de ter voltado a falar em um canal no qual estava com status de AFK e queira voltar a ficar AFK, poderá usar !resumeafk
Este comando poderá apenas ser usado nos primeiros 5 minutos de ter voltado do seu estado de AFK
Caso contrário, para voltar a ficar AFK, use o comando !afk

Para evitar spam de !rafk, o AFK tem um limite de quantos !rafk podem ser usados, sendo esse limite de 3 usos apenas`;
rafkCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/${afkCommand.commandName}/${afkCommand.commandName}.js`;

isAfkCommand.commandName = 'isafk';
isAfkCommand.aliases = ['isafk'];
isAfkCommand.shortDescription = 'Verifica o status de afk de algum usuário no canal atual';
isAfkCommand.cooldown = 5000;
isAfkCommand.whisperable = false;
isAfkCommand.description = `Veja se algum usuário está AFK e há quanto tempo no chat em que o comando foi executado`;
isAfkCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/${afkCommand.commandName}/${afkCommand.commandName}.js`;

module.exports = {
    afkCommand,
    rafkCommand,
    isAfkCommand,
};