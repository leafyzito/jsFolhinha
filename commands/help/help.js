const { processCommand } = require("../../utils/processCommand.js");
const { timeSince } = require("../../utils/utils.js");

const comandosCommand = async (client, message) => {
    message.command = 'comandos';
    if (!await processCommand(5000, 'channel', message, client)) return;

    client.log.logAndReply(message, `Para uma lista de comandos acesse https://folhinhabot.com/comandos`);
    return;
};

const helpCommand = async (client, message) => {
    message.command = 'help';
    if (!await processCommand(5000, 'channel', message, client)) return;

    const specificCommand = message.messageText.split(' ')[1]?.toLowerCase();

    if (!specificCommand) {
        const emote = await client.emotes.getEmoteFromList(message.channelName, client.emotes.happyEmotes, 'peepoHappy');
        client.log.logAndReply(message, `Para informações sobre o bot, acesse https://folhinhabot.com/ ${emote} Para ver infomações sobre um comando específico, use !help <comando>`);
        return;
    }

    const commandsList = client.commandsList;
    if (!(specificCommand in commandsList)) {
        client.log.logAndReply(message, `O comando ${specificCommand} não existe. Para uma lista de comandos, acesse https://folhinhabot.com/comandos`);
        return;
    }

    const commandInfo = commandsList[specificCommand];
    const shortDescription = commandInfo.shortDescription;

    client.log.logAndReply(message, `${commandInfo.aliases[0].charAt(0).toUpperCase() + commandInfo.aliases[0].slice(1)}: ${shortDescription} - https://folhinhabot.com/comandos/${encodeURIComponent(commandInfo.commandName)}`);

};

const statsCommand = async (client, message) => {
    message.command = 'stats';
    if (!await processCommand(5000, 'channel', message, client)) return;

    const uptime = timeSince(client.startTime);
    const channelsCount = [...client.joinedChannels].length;
    const usedRam = process.memoryUsage().heapUsed / 1024 / 1024;

    client.log.logAndReply(message, `Uptime: ${uptime} | Canais: ${channelsCount} | RAM: ${Math.round(usedRam * 100) / 100}mb`);
}

const botStatsCommand = async (client, message) => {
    message.command = 'botstats';
    if (!await processCommand(5000, 'channel', message, client)) return;

    const currentDate = new Date();
    const oneDayBefore = new Date(currentDate.getTime() - (24 * 60 * 60 * 1000));
    const oneHourBefore = new Date(currentDate.getTime() - (60 * 60 * 1000));

    const dayBeforeCommandsCount = await client.db.count('commandlog', { sentDate: { $gte: oneDayBefore } });
    const hourBeforeCommandsCount = await client.db.count('commandlog', { sentDate: { $gte: oneHourBefore } });

    client.log.logAndReply(message, `Comandos nas últimas 24h/1h: ${dayBeforeCommandsCount}/${hourBeforeCommandsCount} - https://shlink.mrchuw.com.br/jErVU`);
};


comandosCommand.commandName = 'comandos';
comandosCommand.aliases = ['comandos', 'commands', 'comando', 'command'];
comandosCommand.shortDescription = 'Veja os comandos disponíveis no bot';
comandosCommand.cooldown = 5000;
comandosCommand.whisperable = true;
comandosCommand.description = 'Apenas um comando para direcionar o usuário para a página de comandos do bot';
comandosCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/help/help.js`;

helpCommand.commandName = 'help';
helpCommand.aliases = ['help', 'ajuda', 'info'];
helpCommand.shortDescription = 'Mostra um link para o site do bot';
helpCommand.cooldown = 5000;
helpCommand.whisperable = true;
helpCommand.description = 'Apenas um comando para direcionar o usuário para a página do bot';
helpCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/help/help.js`;

statsCommand.commandName = 'stats';
statsCommand.aliases = ['stats', 'ping', 'uptime'];
statsCommand.shortDescription = 'Mostra algumas informações sobre o bot';
statsCommand.cooldown = 5000;
statsCommand.whisperable = true;
statsCommand.description = 'Exibe algumas informações sobre o bot, como uptime, quantidade de canais ativos e RAM utilizada';
statsCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/help/help.js`;

botStatsCommand.commandName = 'botstats';
botStatsCommand.aliases = ['botstats', 'bstats'];
botStatsCommand.shortDescription = 'Mostra algumas informações extra sobre o bot';
botStatsCommand.cooldown = 5000;
botStatsCommand.whisperable = true;
botStatsCommand.description = `Exibe algumas estatísticas extra sobre o bot, incluindo ranking de cookies em uma tabela
Estatísticas que podem ser encontradas:
• Total de mensagens
• Total de comandos executados
• Total de usuários vistos pelo bot
• Total de mensagens por usuário
• Total de canais com o Folhinha.
• Gráfico com número de uso para cada comando`;
botStatsCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/help/help.js`;

module.exports = {
    comandosCommand,
    helpCommand,
    statsCommand,
    botStatsCommand
};
