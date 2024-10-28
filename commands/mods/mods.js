const { processCommand } = require("../../utils/processCommand.js");

async function getMods(channel) {
    const api_url = `https://roles.tv/api/channel/login/${channel}`;
    const response = await fetch(api_url);
    const data = await response.json();

    if (data.statusCode === 404) {
        return null;
    }

    const totalMods = data.data.roles.mods.total;

    return totalMods;
}

const modsCommand = async (client, message) => {
    message.command = 'mods';
    if (!await processCommand(5000, 'channel', message, client)) return;

    const targetChannel = message.messageText.split(' ')[1]?.replace(/^@/, '') || message.channelName;
    const mods = await getMods(targetChannel);

    if (mods === null) {
        client.log.logAndReply(message, `Esse canal não existe`);
        return;
    }

    if (mods === 0) {
        client.log.logAndReply(message, `O canal #${targetChannel} não tem nenhum moderador`);
        return;
    }

    client.log.logAndReply(message, `Existem ${mods} moderadores em #${targetChannel} - https://roles.tv/c/${targetChannel.toLowerCase()}`);
};

modsCommand.commandName = 'mods';
modsCommand.aliases = ['mods', 'moderadores', 'moderators'];
modsCommand.shortDescription = 'Mostra a lista de mods de algum canal';
modsCommand.cooldown = 5000;
modsCommand.whisperable = false;
modsCommand.description = `Exibe uma lista de mods do canal fornecido ou, caso nenhum canal seja fornecido, da canal onde o comando foi executado
O comando funcionará mesmo em canais que o Folhinha não esteja presente
• Exemplo: !mods - Exibe a lista de mods do canal atual
• Exemplo: !mods {canal} - Exibe a lista de mods do canal escolhido`;
modsCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/${modsCommand.commandName}/${modsCommand.commandName}.js`;

module.exports = {
    modsCommand,
};
