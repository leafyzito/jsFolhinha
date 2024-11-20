const { join } = require("path");
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

    client.channelsToJoin.push(message.senderUsername);
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

    const channelToJoin = message.senderUsername;
    const alreadyJoinedChannels = [...client.joinedChannels];

    if (alreadyJoinedChannels.includes(channelToJoin)) {
        client.log.logAndReply(message, `Eu já estou no seu chat! O meu prefixo lá é ${client.channelPrefixes[channelToJoin] || '!'}`);
        return;
    }

    await createNewConfig(client, message);
    client.join(channelToJoin).catch((err) => {
        console.error(`Erro ao entrar no chat ${channelToJoin}: ${err}`);
        client.log.logAndReply(message, `Erro ao entrar no chat ${channelToJoin}. Contacte o @${process.env.DEV_NICK}`);
        return;
    });

    const emote = await client.emotes.getEmoteFromList(channelToJoin, ['peepohey', 'heyge'], 'KonCha');
    client.log.send(channelToJoin, `${emote} Oioi! Fui convidado para me juntar aqui! Para saber mais sobre mim, pode usar !ajuda ou !comandos`);

    const happyEmote = await client.emotes.getEmoteFromList(message.channelName, client.emotes.happyEmotes);
    client.log.logAndReply(message, `Entrei no chat ${message.senderUsername} com sucesso! Tô lá te esperando! ${happyEmote} Caso tenha follow-mode ativado, me dê cargo de moderador no seu chat para conseguir falar lá`);
    client.log.logAndWhisper(message, `Caso tenha follow-mode ativado no seu chat, me dê cargo de moderador ou vip para conseguir falar lá :D`);
    return;
};

joinCommand.commandName = 'join';
joinCommand.aliases = ['join', 'entrar'];
joinCommand.shortDescription = 'Convide o bot para entrar no seu chat';
joinCommand.cooldown = 5000;
joinCommand.whisperable = true;
joinCommand.description = `Utilize o comando !join num chat no qual o Folhinha esteja presente e faça com que o bot entre no chat de quem executou o comando

Caso tenha follow-mode ativado no seu chat, o bot não conseguirá falar no seu chat. Para resolver isso, dê cargo de moderador ou vip ao Folhinha`;
joinCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/${joinCommand.commandName}/${joinCommand.commandName}.js`;

module.exports = {
    joinCommand,
};
