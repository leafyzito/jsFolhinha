const { manageCooldown } = require("../../utils/manageCooldown.js");
const { logAndReply } = require("../../utils/log.js");
const { createNewGist } = require("../../utils/utils.js");
const fetch = require('node-fetch');

async function getChatters(channel) {
    api_url = 'https://api.fuchsty.com/twitch/chatters/' + channel;
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
};


const chattersCommand = async (client, message) => {
    message.command = 'chatters';
    if (!manageCooldown(5000, 'channel', message.senderUsername, message.command)) return;

    const targetChannel = message.messageText.split(' ')[1]?.replace(/^@/, '') || message.channelName;
    const chattersRes = await getChatters(targetChannel);

    if (chattersRes === 'erro') {
        logAndReply(client, message, `Esse usuário não existe`);
        return;
    }

    if (!chattersRes) {
        logAndReply(client, message, `Não há chatters em ${targetChannel}`);
        return;
    }

    var streamer = chattersRes[0];
    var mods = chattersRes[1];
    var vips = chattersRes[2];
    var viewers = chattersRes[3];
    var count = chattersRes[4];

    var modsLen = mods.length;
    var vipsLen = vips.length;
    var viewersLen = viewers.length;
    
    var streamer = streamer.join("\n");
    var mods = mods.sort().join("\n");
    var vips = vips.sort().join("\n");
    var viewers = viewers.sort().join("\n");

    var finalList = `Total de chatters em #${targetChannel}: ${count}\n\nStreamer:\n${streamer}\n\nModeradores: (${modsLen})\n${mods}\n\nVips: (${vipsLen})\n${vips}\n\nChatters: (${viewersLen})\n${viewers}`;

    const gistUrl = await createNewGist(finalList);
    
    // TODO: getEmoteFromList
    if (count > 99) {
        logAndReply(client, message, `${count} chatters em #${targetChannel}: ${gistUrl} (devido a limitações do Twitch, esta lista contém apenas 100 chatters)`);
        return;
    }

    logAndReply(client, message, `${count} chatters em #${targetChannel}: ${gistUrl}`);

};


module.exports = { chattersCommand: chattersCommand };
