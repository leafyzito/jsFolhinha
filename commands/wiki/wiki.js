const { processCommand } = require("../../utils/processCommand.js");

async function getRandomWiki() {
    const api_url = `https://pt.wikipedia.org/w/api.php?action=query&list=random&rnnamespace=0&format=json`;
    const response = await fetch(api_url);
    const data = await response.json();
    const title = data.query.random[0].title.replace(/ /g, '_');
    return `https://pt.wikipedia.org/wiki/${title}`;
}

const wikiCommand = async (client, message) => {
    message.command = 'wiki';
    if (!await processCommand(5000, 'channel', message, client)) return;

    const wiki = await getRandomWiki();

    const emote = await client.emotes.getEmoteFromList(message.channelName, ['nerd', 'nerdge', 'catnerd', 'dognerd', 'giganerd'], '🤓')
    client.log.logAndReply(message, `${wiki} ${emote}`);
    return;
};

wikiCommand.commandName = 'wiki';
wikiCommand.aliases = ['wiki', 'wikipedia'];
wikiCommand.shortDescription = 'Mostra um artigo aleatório do Wikipedia';
wikiCommand.cooldown = 5000;
wikiCommand.whisperable = true;
wikiCommand.description = 'Uso: !wiki; Resposta esperada: {link do artigo aleatório}';
wikiCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/${wikiCommand.commandName}/${wikiCommand.commandName}.js`;

module.exports = {
    wikiCommand,
};
