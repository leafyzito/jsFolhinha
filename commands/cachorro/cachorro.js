const { processCommand } = require("../../utils/processCommand.js");
const { shortenUrl, randomInt, randomChoice } = require("../../utils/utils.js");

async function getDog() {
    const api_url = 'https://www.googleapis.com/customsearch/v1';
    const query = 'cute funny dog pinterest';
    const start_index = randomInt(1, 10);
    const random_num = randomInt(0, 9);
    const sort_option = randomChoice([null, "date", "rating"]);
    const params = {
        key: process.env.GOOGLE_SEARCH_API_KEY,
        cx: process.env.GOOGLE_SEARCH_ENGINE_ID,
        q: query,
        searchType: 'image',
        start: start_index
        // sort: sort_option,
    };

    try {
        const response = await fetch(`${api_url}?${new URLSearchParams(params)}`);
        const data = await response.json();
        if (data.items == null) { return null; }
        const image_link = data.items[random_num].link;
        return shortenUrl(image_link);
    }
    catch (error) {
        console.error('Error fetching dog image:', error);
        return null;
    }

}


const cachorroCommand = async (client, message) => {
    message.command = 'cachorro';
    if (!await processCommand(5000, 'channel', message, client)) return;

    const dog = await getDog();
    if (!dog) {
        client.log.logAndReply(message, `Erro ao buscar imagem, tente novamente`);
        return;
    }

    client.log.logAndReply(message, `🐶 ${dog}`);
};

cachorroCommand.commandName = 'cachorro';
cachorroCommand.aliases = ['cachorro', 'dog', 'doggo', 'cao'];
cachorroCommand.shortDescription = 'Mostra uma imagem aleatória de cachorro';
cachorroCommand.cooldown = 5000;
cachorroCommand.whisperable = true;
cachorroCommand.description = 'Uso: !cachorro; Resposta esperada: 🐶 {imagem}';
cachorroCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/${cachorroCommand.commandName}/${cachorroCommand.commandName}.js`;

module.exports = {
    cachorroCommand,
};
