async function getRandomWiki() {
  const api_url = `https://pt.wikipedia.org/w/api.php?action=query&list=random&rnnamespace=0&format=json`;
  const data = await fb.got(api_url);
  if (!data) {
    return null;
  }
  const title = data.query.random[0].title.replace(/ /g, "_");
  return `https://pt.wikipedia.org/wiki/${title}`;
}

const wikiCommand = async (message) => {
  const wiki = await getRandomWiki();

  const emote = await fb.emotes.getEmoteFromList(
    message.channelName,
    ["nerd", "nerdge", "catnerd", "dognerd", "giganerd"],
    "🤓"
  );

  return {
    reply: `${emote} ${wiki}`,
  };
};

wikiCommand.commandName = "wiki";
wikiCommand.aliases = ["wiki", "wikipedia"];
wikiCommand.shortDescription = "Mostra um artigo aleatório do Wikipedia";
wikiCommand.cooldown = 5000;
wikiCommand.cooldownType = "channel";
wikiCommand.whisperable = true;
wikiCommand.description = `Apenas um comando para receber um artigo aleatório do Wikipedia`;
wikiCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/src/commands/${__dirname.split("/").pop()}/${__filename.split("/").pop()}`;

module.exports = {
  wikiCommand,
};
