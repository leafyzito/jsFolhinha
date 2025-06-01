import { processCommand } from '../../utils/processCommand.js';
import { shortenUrl, randomInt } from '../../utils/utils.js';

async function getCat() {
    const api_url = 'https://www.googleapis.com/customsearch/v1';
    const query = 'cute funny cat pinterest';
    const start_index = randomInt(1, 10);
    const random_num = randomInt(0, 9);
    const params = {
        key: process.env.GOOGLE_SEARCH_API_KEY,
        cx: process.env.GOOGLE_SEARCH_ENGINE_ID,
        q: query,
        searchType: 'image',
        start: start_index,
    };

    try {
        const response = await fetch(`${api_url}?${new URLSearchParams(params)}`);
        const data = await response.json();
        if (data.items == null) {
            return null;
        }
        const image_link = data.items[random_num].link;
        return shortenUrl(image_link);
    } catch (error) {
        console.error('Error fetching dog image:', error);
        return null;
    }
}

const gatoCommand = async (client, message) => {
    message.command = 'gato';
    if (!(await processCommand(5000, 'channel', message, client))) return;

    const cat = await getCat();
    if (!cat) {
        client.log.logAndReply(message, `Erro ao buscar imagem, tente novamente`);
        return;
    }

    client.log.logAndReply(message, `🐱 ${cat}`);
};

gatoCommand.commandName = 'gato';
gatoCommand.aliases = ['gato', 'cat'];
gatoCommand.shortDescription = 'Mostra uma imagem aleatória de gato';
gatoCommand.cooldown = 5000;
gatoCommand.whisperable = true;
gatoCommand.description = `Receba uma imagem aleatória de um gato
A pesquisa das fotos é feita usando o Google, então meio que pode vir qualquer coisa relacionada com gatos`;
gatoCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/${gatoCommand.commandName}/${gatoCommand.commandName}.js`;

export { gatoCommand };
