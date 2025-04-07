const { processCommand } = require("../../utils/processCommand.js");
const fetch = require('node-fetch');
const FormData = require('form-data');

async function uploadToFeridinha(content) {
    const api_url = 'https://feridinha.com/upload';
    const headers = { 'token': process.env.FERIDINHA_API_KEY };

    const form = new FormData();
    form.append('file', content, 'image.jpg');

    const response = await fetch(api_url, {
        method: 'POST',
        headers: { 'token': headers.token, ...form.getHeaders() }, // Include FormData headers
        body: form
    });

    if (response.ok) { // Check if status is 200-299
        const resData = await response.json();

        if (resData.success) {
            return resData.message;
        }

        console.log(`Failed to upload to feridinha. resData: ${JSON.stringify(resData)}`);
        return null;
    } else {
        console.log(`Error: ${response.status} ${response.statusText}`);
        return null;
    }
}

async function getImage(url) {
    const response = await fetch(url);
    const imageData = await response.buffer();
    return await uploadToFeridinha(imageData);
}

async function getAvatar(avatarTarget) {
    const api_url = `https://api.twitch.tv/helix/users?login=${avatarTarget}`;
    const headers = { "Client-ID": process.env.BOT_CLIENT_ID, "Authorization": `Bearer ${process.env.BOT_OAUTH_TOKEN}` };
    const response = await fetch(api_url, { headers });
    const data = await response.json();

    if (!response.ok || data.data.length === 0) { return null; }

    return await getImage(data.data[0].profile_image_url);
}

const avatarCommand = async (client, message) => {
    message.command = 'avatar';
    if (!await processCommand(5000, 'channel', message, client)) return;

    const avatarTarget = message.messageText.split(' ')[1]?.replace(/^@/, '') || message.senderUsername;
    const avatar = await getAvatar(avatarTarget);

    if (!avatar) {
        client.log.logAndReply(message, `O usuário ${avatarTarget} não existe`);
        return;
    }

    client.log.logAndReply(message,
        `${avatarTarget == message.senderUsername ? `O seu avatar é: ${avatar}` : `O avatar de ${avatarTarget} é: ${avatar}`}`);

};

avatarCommand.commandName = 'avatar';
avatarCommand.aliases = ['avatar', 'pfp'];
avatarCommand.shortDescription = 'Mostra o avatar de algum usuário';
avatarCommand.cooldown = 5000;
avatarCommand.whisperable = true;
avatarCommand.description = `Marque alguém para ver a foto de perfil.
• Exemplo: !avatar @pessoa`;
avatarCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/${avatarCommand.commandName}/${avatarCommand.commandName}.js`;

module.exports = {
    avatarCommand,
};
