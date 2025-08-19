async function getCat() {
  const api_url = "https://www.googleapis.com/customsearch/v1";
  const query = "cute funny cat pinterest";
  const start_index = fb.utils.randomInt(1, 10);
  const random_num = fb.utils.randomInt(0, 9);

  // Build query string with parameters
  const queryParams = new URLSearchParams({
    key: process.env.GOOGLE_SEARCH_API_KEY,
    cx: process.env.GOOGLE_SEARCH_ENGINE_ID,
    q: query,
    searchType: "image",
    start: start_index.toString(),
  });

  try {
    const response = await fb.request(`${api_url}?${queryParams.toString()}`);
    const data = await response.body.json();
    if (data.items == null) {
      return null;
    }
    const image_link = data.items[random_num].link;
    const shortenedUrl = await fb.api.chuw.shortenUrl(image_link);
    return shortenedUrl;
  } catch (error) {
    console.error("Error fetching cat image:", error);
    return null;
  }
}

const gatoCommand = async () => {
  const cat = await getCat();
  if (!cat) {
    return {
      reply: `Erro ao buscar imagem, tente novamente`,
    };
  }

  return {
    reply: `🐱 ${cat}`,
  };
};

gatoCommand.commandName = "gato";
gatoCommand.aliases = ["gato", "cat"];
gatoCommand.shortDescription = "Mostra uma imagem aleatória de gato";
gatoCommand.cooldown = 5000;
gatoCommand.cooldownType = "channel";
gatoCommand.whisperable = true;
gatoCommand.description = `Receba uma imagem aleatória de um gato
A pesquisa das fotos é feita usando o Google, então meio que pode vir qualquer coisa relacionada com gatos`;
gatoCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/src/commands/${__dirname
  .split("/")
  .pop()}/${__filename.split("/").pop()}`;

module.exports = {
  gatoCommand,
};
