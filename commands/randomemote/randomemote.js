const { processCommand } = require("../../utils/processCommand.js");

const randomEmoteCommand = async (client, message) => {
    message.command = 'randomemote';
    if (!await processCommand(5000, 'channel', message, client)) return;

    var amount = message.messageText.split(' ')[1] || 1;
    amount = parseInt(amount);
    if (isNaN(amount) || amount < 1) {
        amount = 1;
    }

    if (amount > 50) {
        client.log.logAndReply(message, `O limite máximo é 50`);
        return;
    }

    const channelEmotes = await client.emotes.getChannelEmotes(message.channelName);
    var emotesList = [];

    for (let i = 0; i < amount; i++) {
        var randomEmote = Math.floor(Math.random() * channelEmotes.length);

        if (emotesList.includes(channelEmotes[randomEmote])) {
            continue;
        }

        while (['$', '*', '!', '|', '+', '?', '%', '=', '&', '/', '#', '.', ',', '<', '>', '@', '⠀', '-', '\\', '\\']
            .some(char => channelEmotes[randomEmote].startsWith(char))) {
            randomEmote = Math.floor(Math.random() * channelEmotes.length);
        }

        emotesList.push(channelEmotes[randomEmote]);
    }

    var finalRes = emotesList.join(' ').substring(0, 490);
    client.log.logAndReply(message, `🤖 ${finalRes}`);
}

randomEmoteCommand.commandName = 'randomemote';
randomEmoteCommand.aliases = ['randomemote', 'rem', 'emote', 'emotes'];
randomEmoteCommand.shortDescription = 'Mostra um emote aleatório do canal atual';
randomEmoteCommand.cooldown = 5000;
randomEmoteCommand.whisperable = false;
randomEmoteCommand.description = 'Uso: !randomemote (opcional: <quantidade> default: 1); Resposta esperada: 🤖 {emotes aleatório}';
randomEmoteCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/${randomEmoteCommand.commandName}/${randomEmoteCommand.commandName}.js`;
module.exports = {
    randomEmoteCommand,
};