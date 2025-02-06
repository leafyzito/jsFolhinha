const { processCommand } = require("../../utils/processCommand.js");

async function getChannelFounders(channel) {
    const api_url = `https://roles.tv/api/channel/login/${channel}`;
    const response = await fetch(api_url);
    const data = await response.json();

    if (data.error && data.error != null) {
        return null;
    }

    const totalFounders = data.data.roles.founders;

    return totalFounders;
}

const foundersCommand = async (client, message) => {
    message.command = 'founders';
    if (!await processCommand(5000, 'channel', message, client)) return;

    const targetChannel = message.messageText.split(' ')[1]?.replace(/^@/, '') || message.channelName;
    const founders = await getChannelFounders(targetChannel);

    if (founders === null) {
        client.log.logAndReply(message, `Esse canal não existe`);
        return;
    }

    if (founders === 0) {
        client.log.logAndReply(message, `O canal #${targetChannel} não tem nenhum fundador`);
        return;
    }

    client.log.logAndReply(message, `Existem ${founders} fundadores em #${targetChannel} - https://roles.tv/c/${targetChannel.toLowerCase()}`);
};

foundersCommand.commandName = 'founders';
foundersCommand.aliases = ['founders', 'fundadores'];
foundersCommand.shortDescription = 'Mostra a lista de founders de algum canal';
foundersCommand.cooldown = 5000;
foundersCommand.whisperable = false;
foundersCommand.description = `Exibe uma lista de founders do canal fornecido ou, caso nenhum canal seja fornecido, da canal onde o comando foi executado
O comando funcionará mesmo em canais que o Folhinha não esteja presente
• Exemplo: !founders - Exibe a lista de founders do canal atual
• Exemplo: !founders {canal} - Exibe a lista de founders do canal escolhido`;
foundersCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/${foundersCommand.commandName}/${foundersCommand.commandName}.js`;

module.exports = {
    foundersCommand,
};
