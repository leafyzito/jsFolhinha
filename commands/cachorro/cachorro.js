const { manageCooldown } = require("../../utils/manageCooldown.js");
const { logAndReply } = require("../../utils/log.js");
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
    if (!manageCooldown(5000, 'channel', message.senderUsername, message.command)) return;

    const dog = await getDog();
    if (!dog) {
        logAndReply(client, message, `Erro ao buscar imagem, tente novamente`);
        return;
    }

    logAndReply(client, message, `🐶 ${dog}`);
};


module.exports = {
    cachorroCommand: cachorroCommand,
    cachorroAliases: ['cachorro', 'dog', 'doggo', 'cao']
};
