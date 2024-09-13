const { processCommand } = require("../../utils/processCommand.js");

async function getColor(userId) {
    const api_url = `https://api.twitch.tv/helix/chat/color?user_id=${userId}`;
    const headers = { "Client-ID": process.env.BOT_CLIENT_ID, "Authorization": `Bearer ${process.env.BOT_OAUTH_TOKEN}` };
    // Make API request to fetch color
    const response = await fetch(api_url, { headers });
    const data = await response.json();

    return data.data[0].color;
}

async function getColorName(hexCode) {
    hexCode = hexCode.replace("#", "");
    const api_url = `https://www.thecolorapi.com/id?hex=${hexCode}`;

    const response = await fetch(api_url);
    const data = await response.json();

    return data.name.value;
}

const corCommand = async (client, message) => {
    message.command = 'cor';
    if (!await processCommand(5000, 'channel', message, client)) return;

    const colorTarget = message.messageText.split(' ')[1]?.replace(/^@/, '') || message.senderUserID;
    const colorTargetID = (colorTarget !== message.senderUserID) ? await client.getUserID(colorTarget) : message.senderUserID;

    if (!colorTargetID) {
        client.log.logAndReply(message, `O usuário ${colorTarget} não existe`);
        return;
    }

    const color = await getColor(colorTargetID);
    if (!color) {
        client.log.logAndReply(message, `${colorTarget} não tem uma cor definida`);
        return;
    }

    const colorName = await getColorName(color);

    client.log.logAndReply(message,
        `${colorTarget == message.senderUserID ? `A sua cor é: ${color} - ${colorName}` : `A cor de ${colorTarget} é: ${color} - ${colorName}`}`);
};

corCommand.commandName = 'cor';
corCommand.aliases = ['cor', 'color'];
corCommand.shortDescription = 'Mostra a cor de algum usuário';
corCommand.cooldown = 5000;
corCommand.whisperable = true;
corCommand.description = `Veja a cor de algum usuário. O bot responderá com o código hexadecimal da cor juntamente com o nome da mesma. Caso nenhum usuário tenha sido marcado, exibirá a cor de quem realizou o comando
• Exemplo: !cor - O bot vai responder com a informações sobre a cor de quem realizou o comando
• Exemplo: !cor @usuário - O bot vai responder com a informações sobre a cor de @usuário`;
corCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/${corCommand.commandName}/${corCommand.commandName}.js`;

module.exports = {
    corCommand,
};
