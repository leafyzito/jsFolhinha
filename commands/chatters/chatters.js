import { processCommand } from '../../utils/processCommand.js';
import { createNewGist } from '../../utils/utils.js';
import fetch from 'node-fetch';

async function getChatters(channel) {
    const api_url = `https://api.fuchsty.com/twitch/chatters/${channel}`;
    const response = await fetch(api_url);
    const data = await response.json();

    if ('error' in data) {
        return 'erro';
    }

    const count = data.count;
    if (count === 0) {
        return null;
    }

    const broadcaster = data.chatters.broadcasters || [];
    const mods = data.chatters.moderators || [];
    const vips = data.chatters.vips || [];
    const viewers = data.chatters.viewers || [];

    return [broadcaster, mods, vips, viewers, count];
}

const chattersCommand = async (client, message) => {
    message.command = 'chatters';
    if (!(await processCommand(5000, 'channel', message, client))) return;

    const targetChannel =
        message.messageText.split(' ')[1]?.replace(/^@/, '') || message.channelName;
    const chattersRes = await getChatters(targetChannel);

    if (chattersRes === 'erro') {
        client.log.logAndReply(message, `Esse usuário não existe`);
        return;
    }

    if (!chattersRes) {
        client.log.logAndReply(message, `Não há chatters em ${targetChannel}`);
        return;
    }

    let streamer = chattersRes[0];
    let mods = chattersRes[1];
    let vips = chattersRes[2];
    let viewers = chattersRes[3];
    let count = chattersRes[4];

    let modsLen = mods.length;
    let vipsLen = vips.length;
    let viewersLen = viewers.length;

    streamer = streamer.join('\n');
    mods = mods.sort().join('\n');
    vips = vips.sort().join('\n');
    viewers = viewers.sort().join('\n');

    let finalList = `Total de chatters em #${targetChannel}: ${count}\n\nStreamer:\n${streamer}\n\nModeradores: (${modsLen})\n${mods}\n\nVips: (${vipsLen})\n${vips}\n\nChatters: (${viewersLen})\n${viewers}`;

    const gistUrl = await createNewGist(finalList);

    // TODO: getEmoteFromList
    if (count > 99) {
        client.log.logAndReply(
            message,
            `Existem ${count} chatters em #${targetChannel}: ${gistUrl} (devido a limitações da Twitch, esta lista contém apenas 100 chatters)`
        );
        return;
    }

    client.log.logAndReply(message, `Existem ${count} chatters em #${targetChannel}: ${gistUrl}`);
};

chattersCommand.commandName = 'chatters';
chattersCommand.aliases = ['chatters'];
chattersCommand.shortDescription = 'Mostra a lista de chatters de algum canal';
chattersCommand.cooldown = 5000;
chattersCommand.whisperable = false;
chattersCommand.description = `Exibe uma lista de usuários totais online no canal e suas devidas categorias (Streamer, Moderadores, VIPs, Chatters)
O comando funcionará mesmo em canais que o Folhinha não esteja presente
• Exemplo: !chatters - Exibe a lista de chatters do canal atual
• Exemplo: !chatters {canal} - Exibe a lista de chatters do canal escolhido`;
chattersCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/${chattersCommand.commandName}/${chattersCommand.commandName}.js`;

export { chattersCommand };
