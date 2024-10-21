const { processCommand } = require("../../utils/processCommand.js");

async function creteTwitchClip(channelId) {
    const api_url = `https://api.twitch.tv/helix/clips?broadcaster_id=${channelId}&has_delay=true`;
    const response = await fetch(api_url, {
        method: 'POST',
        headers: { "Client-ID": process.env.BOT_CLIENT_ID, "Authorization": `Bearer ${process.env.BOT_OAUTH_TOKEN}` }
    });

    const data = await response.json();
    if (data.status === 403) { return 'forbidden'; };
    if (data.status === 404) { return null; };

    const clipId = data.data[0].id;
    const editUrl = data.data[0].edit_url;

    // Add a 1 second timeout, to give time for the clip to be created correctly
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
        id: clipId,
        editUrl: editUrl
    }
}


const clipCommand = async (client, message) => {
    message.command = 'clip';
    if (!await processCommand(5000, 'channel', message, client)) return;

    const targetChannel = message.messageText.split(' ')[1]?.replace(/^@/, '') || message.channelName;
    const targetId = message.channelName === targetChannel ? message.channelID : await client.getUserID(targetChannel);
    if (!targetId) {
        client.log.logAndReply(message, `Esse usuário não existe`);
        return;
    }

    const clip = await creteTwitchClip(targetId);
    if (!clip) {
        client.log.logAndReply(message, `O canal ${targetChannel} não está em live`);
        return;
    }
    else if (clip === 'forbidden') {
        client.log.logAndReply(message, `Esse canal não permite criar clipes durante a live`);
        return;
    }
    client.log.logAndReply(message, `🎬 https://clips.twitch.tv/${clip.id}`)
    return;
};

clipCommand.commandName = 'clip';
clipCommand.aliases = ['clip', 'clipe'];
clipCommand.shortDescription = 'Crie um clip de alguma live';
clipCommand.cooldown = 5000;
clipCommand.whisperable = true;
clipCommand.description = `Crie um clip de alguma live. Se nenhum canal for especificado, o comando irá criar um clip do canal onde o comando foi executado
• Exemplo: !clip - O bot vai criar um clip do canal onde o comando foi executado
• Exemplo: !clip @leafyzito - O bot vai criar um clip do canal do usuário @leafyzito, caso ele esteja em live`;
clipCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/${clipCommand.commandName}/${clipCommand.commandName}.js`;

module.exports = {
    clipCommand,
};
