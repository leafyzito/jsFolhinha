const { join } = require("path");
const { processCommand } = require("../../utils/processCommand.js");
const fs = require('fs');
const { addChannelToRustlog } = require('../../utils/rustlog.js');

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

    await addChannelToRustlog(client, message.senderUserID);

    client.discord.importantLog(`* Joining to ${message.senderUsername} from join command`);

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

const joinCommand = async (client, message, anonClient) => {
    message.command = 'join';
    if (!await processCommand(5000, 'user', message, client)) return;

    const channelToJoin = message.senderUsername;
    const alreadyJoinedChannels = [...anonClient.joinedChannels];

    if (alreadyJoinedChannels.includes(channelToJoin)) {
        client.log.logAndReply(message, `Eu já estou no seu chat! O meu prefixo lá é ${client.channelPrefixes[channelToJoin] || '!'}`);
        return;
    }

    client.channelsToJoin.push(channelToJoin);
    anonClient.channelsToJoin.push(channelToJoin);
    await createNewConfig(client, message);
    anonClient.join(channelToJoin).catch((err) => {
        console.error(`Erro ao entrar no chat ${channelToJoin}: ${err}`);
        client.log.logAndReply(message, `Erro ao entrar no chat ${channelToJoin}. Contacte o @${process.env.DEV_NICK}`);
        return;
    });

    const emote = await client.emotes.getEmoteFromList(channelToJoin, ['peepohey', 'heyge'], 'KonCha');
    client.log.send(channelToJoin, `${emote} Oioi! Fui convidado para me juntar aqui! Para saber mais sobre mim, pode usar !ajuda ou !comandos`);

    const happyEmote = await client.emotes.getEmoteFromList(message.channelName, client.emotes.happyEmotes);
    client.log.logAndReply(message, `Entrei no chat ${message.senderUsername} com sucesso! Tô lá te esperando! ${happyEmote} Caso tenha follow-mode ativado, me dê cargo de moderador no seu chat para conseguir falar lá`);
    client.log.logAndWhisper(message, `Caso tenha follow-mode ativado no seu chat, me dê cargo de moderador para conseguir falar lá :D`);
    return;
};

joinCommand.commandName = 'join';
joinCommand.aliases = ['join', 'entrar'];
joinCommand.shortDescription = 'Convide o bot para entrar no seu chat';
joinCommand.cooldown = 5000;
joinCommand.whisperable = true;
joinCommand.description = `Utilize o comando !join num chat no qual o Folhinha esteja presente e faça com que o bot entre no chat de quem executou o comando

Se quiser convidar o bot para um chat que você modera, acesse <a href="https://folhinhabot.com/" target="_blank" style="color: #67e8f9">a página principal do site</a> e na aba de "Convidar para um canal que você modera" coloque o canal para o qual você deseja convidar o bot

Caso tenha follow-mode ativado no chat, o bot não conseguirá falar. Para resolver isso, dê cargo de moderador ou vip ao Folhinha`;
joinCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/${joinCommand.commandName}/${joinCommand.commandName}.js`;

module.exports = {
    joinCommand,
};
