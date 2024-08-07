const { processCommand } = require("../../utils/processCommand.js");
const fs = require('fs');

async function createNewConfig(client, message) {
    const newConfig = {
        channel: message.senderUsername,
        channelId: message.senderUserID,
        prefix: '!',
        offlineOnly: false,
        isPaused: false,
        disabledCommands: [],
        devBanCommands: []
    };

    await client.db.insert('config', newConfig);
    await client.reloadChannelConfigs();
    await client.reloadChannelPrefixes();

    fs.appendFile('channels.txt',
        `${message.senderUserID} ${message.senderUsername}\n`, (err) => {
            if (err) {
                console.error(`Erro ao adicionar ${message.senderUsername} ao channels.txt: ${err}`);
                return;
            }
            console.log('Data appended to channels.txt');
        });

    return;
}

const joinCommand = async (client, message) => {
    message.command = 'join';
    if (!await processCommand(5000, 'user', message, client)) return;

    if (message.channelName !== 'folhinhabot' && message.channelName !== process.env.DEV_NICK) {
        client.log.logAndReply(message, `Se quiser me convidar para o seu chat, use o comando ${message.commandPrefix}join no meu chat ou do dev (@${process.env.DEV_NICK})`);
        return;
    }

    const channelToJoin = message.senderUsername;
    const alreadyJoinedChannels = [...client.joinedChannels];

    if (alreadyJoinedChannels.includes(channelToJoin)) {
        client.log.logAndReply(message, `Já estou no chat ${channelToJoin}`);
        return;
    }

    await createNewConfig(client, message);
    client.join(channelToJoin).catch((err) => {
        client.log.logAndReply(message, `Erro ao entrar no chat ${channelToJoin}. Contacte o @${process.env.DEV_NICK}`);
        return;
    });

    client.log.send(channelToJoin, `KonCha Oioi! Fui convidado para me juntar aqui! Para saber mais sobre mim, pode usar !ajuda ou !comandos`);

    client.log.logAndReply(message, `Entrei no chat ${message.senderUsername} com sucesso! Tô lá te esperando!`);
    return;
};

joinCommand.aliases = ['join', 'entrar'];

module.exports = {
    joinCommand,
};
