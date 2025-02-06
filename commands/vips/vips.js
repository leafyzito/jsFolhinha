const { processCommand } = require("../../utils/processCommand.js");

async function getChannelVips(channel) {
    const api_url = `https://roles.tv/api/channel/login/${channel}`;
    const response = await fetch(api_url);
    const data = await response.json();

    if (data.error && data.error != null) {
        return null;
    }

    const totalVips = data.data.roles.vips;

    return totalVips;
}

const vipsCommand = async (client, message) => {
    message.command = 'vips';
    if (!await processCommand(5000, 'channel', message, client)) return;

    const targetChannel = message.messageText.split(' ')[1]?.replace(/^@/, '') || message.channelName;
    const vips = await getChannelVips(targetChannel);

    if (vips === null) {
        client.log.logAndReply(message, `Esse canal não existe`);
        return;
    }

    if (vips === 0) {
        client.log.logAndReply(message, `O canal #${targetChannel} não tem nenhum vip`);
        return;
    }

    client.log.logAndReply(message, `Existem ${vips} VIPs em #${targetChannel} - https://roles.tv/c/${targetChannel.toLowerCase()}`);
};

vipsCommand.commandName = 'vips';
vipsCommand.aliases = ['vips'];
vipsCommand.shortDescription = 'Mostra a lista de vips de algum canal';
vipsCommand.cooldown = 5000;
vipsCommand.whisperable = false;
vipsCommand.description = `Exibe uma lista de vips do canal fornecido ou, caso nenhum canal seja fornecido, da canal onde o comando foi executado
O comando funcionará mesmo em canais que o Folhinha não esteja presente
• Exemplo: !vips - Exibe a lista de vips do canal atual
• Exemplo: !vips {canal} - Exibe a lista de vips do canal escolhido`;
vipsCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/${vipsCommand.commandName}/${vipsCommand.commandName}.js`;

module.exports = {
    vipsCommand,
};
