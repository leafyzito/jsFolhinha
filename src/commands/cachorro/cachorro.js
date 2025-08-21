async function getDog() {
  const api_url = "https://www.googleapis.com/customsearch/v1";
  const query = "cute funny dog pinterest";
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
    const response = await fb.got(`${api_url}?${queryParams.toString()}`);
    if (!response) {
      return null;
    }
    const data = response;
    if (data.items == null) {
      return null;
    }
    const image_link = data.items[random_num].link;
    const shortenedUrl = await fb.api.chuw.shortenUrl(image_link);
    return shortenedUrl;
  } catch (error) {
    console.error("Error fetching dog image:", error);
    return null;
  }
}

const cachorroCommand = async () => {
  const dog = await getDog();
  if (!dog) {
    return {
      reply: `Erro ao buscar imagem, tente novamente`,
    };
  }

  return {
    reply: `🐶 ${dog}`,
  };
};

cachorroCommand.commandName = "cachorro";
cachorroCommand.aliases = ["cachorro", "dog", "doggo", "cao"];
cachorroCommand.shortDescription = "Mostra uma imagem aleatória de cachorro";
cachorroCommand.cooldown = 5000;
cachorroCommand.cooldownType = "channel";
cachorroCommand.whisperable = true;
cachorroCommand.description = `Receba uma imagem aleatória de um cachorro
A pesquisa das fotos é feita usando o Google, então meio que pode vir qualquer coisa relacionada com cachorros`;
cachorroCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/src/commands/${__dirname
  .split("/")
  .pop()}/${__filename.split("/").pop()}`;

module.exports = {
  cachorroCommand,
};
