const { processCommand } = require("../../utils/processCommand.js");
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
    client.reloadAfkUsers();
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
    
    if (afkStats.rafk_counter >= 4) { return; }
    if (afkStats.rafk_counter >= 3) {
        client.log.logAndReply(message, `Você só pode usar o comando ${message.commandPrefix}rafk 3 vezes seguidas`);
        await client.db.update('afk', { channel: message.channelName, user: message.senderUsername }, { $set: { rafk_counter: afkStats.rafk_counter + 1 } });
        return;
    }

    const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds
    const currentTime = Math.floor(Date.now() / 1000);
    var deltaTime = currentTime - afkStats.afk_return;
    if (deltaTime > 300) {
        client.log.logAndReply(message, `Já se passaram mais de 5 minutos desde que você voltou`);
        return;
    }

    const afkInfoObject = afkInfoObjects.find(afk => afk.alias.includes(afkStats.afk_type));
    const afkAction = afkInfoObject.rafk;
    const afkEmoji = afkInfoObject.emoji;

    client.log.logAndReply(message, `${message.senderUsername} voltou ${afkAction} ${afkEmoji} ${afkStats.afk_message ? `: ${afkStats.afk_message}` : ''}`);
    await client.db.update('afk', { channel: message.channelName, user: message.senderUsername }, { $set: { is_afk: true, rafk_counter: afkStats.rafk_counter + 1 } });
    client.reloadAfkUsers();
    return;
};


afkCommand.aliases = [...afkAliasList];
rafkCommand.aliases = ['rafk'];

module.exports = {
    afkCommand,
    rafkCommand
};