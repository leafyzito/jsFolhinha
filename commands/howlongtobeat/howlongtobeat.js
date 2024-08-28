const { processCommand } = require("../../utils/processCommand.js");

var HLTB_JS_FILE_HASH_KEY = "hltb-file-hash";
var HLTB_ENDPOINT_HASH_KEY = "hltb-endpoint-hash";

const FILE_PREFIX = "_next/static/chunks/pages";
const FILE_HASH_REGEX = /static\/chunks\/pages\/(_app-\w+?\.js)/;
const ENDPOINT_HASH_REGEX = /\/api\/search\/".concat\("(\w+)"\)/;

async function fetchFileHash(force = false) {
    const existing = HLTB_JS_FILE_HASH_KEY;
    if (!force && existing) {
        return existing;
    }

    const headers = { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36" };
    const response = await fetch("https://howlongtobeat.com/", { headers })
        .catch(err => console.error(`Error in HLTB fetching file hash: ${err}`));


    const body = await response.text();
    const match = body.match(FILE_HASH_REGEX);
    if (!match) {
        return null;
    }

    HLTB_JS_FILE_HASH_KEY = match[1];

    return match[1];
}

async function fetchEndpointHash(fileHash, force = false) {
    const existing = HLTB_ENDPOINT_HASH_KEY;
    if (!force && existing) {
        return existing;
    }

    const headers = { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36" };
    const response = await fetch(`https://howlongtobeat.com/${FILE_PREFIX}/${fileHash}`, { headers })
        .catch(err => console.error(`Error in HLTB fetching endpoint hash: ${err}`));

    const body = await response.text();
    const match = body.match(ENDPOINT_HASH_REGEX);
    if (!match) {
        return null;
    }

    HLTB_ENDPOINT_HASH_KEY = match[1];

    return match[1];
}

async function hltbSearch(query) {
    const fileHash = await fetchFileHash(true);
    if (!fileHash) {
        return 'file error';
    }

    const endpointHash = await fetchEndpointHash(fileHash, true);
    if (!endpointHash) {
        return 'endpoint error';
    }

    const response = await fetch(`https://howlongtobeat.com/api/search/${endpointHash}`, {
        method: 'POST',
        headers: {
            'Referer': 'https://howlongtobeat.com/',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            searchType: "games",
            searchTerms: [...query],
            searchPage: 1,
            searchOptions: {
                filter: "",
                games: {
                    gameplay: { perspective: "", flow: "", genre: "" },
                    modifier: "",
                    platform: "",
                    rangeCategory: "main",
                    rangeTime: { min: null, max: null },
                    rangeYear: { min: "", max: "" },
                    sortCategory: "popular",
                    userId: 0
                },
                randomizer: 0,
                sort: 0
            },
            size: 1
        })
    }).catch(err => { console.error(`HTTP request failed: ${err}`); return null; });

    if (!response) {
        return 'HTTP request failed';
    }

    // Check if the response was OK and log the body for debugging
    if (!response.ok) {
        console.error(`HTTP Error Response: ${response.status} ${response.statusText}`);
        console.log(await response.text()); // Log the text of the response
        return 'HTTP error response';
    }

    try {
        const jsonData = await response.json();
        // console.log(jsonData);
        return jsonData;
    } catch (err) {
        console.error(`Error in parsing JSON: ${err}`);
        return 'error parsing JSON';
    }
}

function convertToHours(time) {
    // yoiked xdd
    return (Math['round'](time / 3600 * (10 ** 1))) / (10 ** 1);
}


const howLongToBeatCommand = async (client, message) => {
    message.command = 'howlongtobeat';
    if (!await processCommand(5000, 'channel', message, client)) return;

    const args = message.messageText.split(' ');
    const query = args.slice(1);

    if (query.length === 0) {
        client.log.logAndReply(message, `Use o formato: ${message.commandPrefix}howlongtobeat <jogo>`);
        return;
    }

    const result = await hltbSearch(query);
    if (result === 'file error') {
        client.log.logAndReply(message, `Erro ao buscar buscar o jogo. @${process.env.DEV_NICK} check logs - file hash error`);
        return;
    }

    if (result === 'endpoint error') {
        client.log.logAndReply(message, `Erro ao buscar buscar o jogo. @${process.env.DEV_NICK} check logs - endpoint hash error`);
        return;
    }

    if (result === 'HTTP request failed') {
        client.log.logAndReply(message, `Erro ao buscar buscar o jogo. @${process.env.DEV_NICK} check logs - HTTP request failed`);
        return;
    }

    if (result === 'HTTP error response') {
        client.log.logAndReply(message, `Erro ao buscar buscar o jogo. @${process.env.DEV_NICK} check logs - HTTP error response`);
        return;
    }

    if (result === 'error parsing JSON') {
        client.log.logAndReply(message, `Erro ao buscar buscar o jogo. @${process.env.DEV_NICK} check logs - error parsing JSON`);
        return;
    }

    if (result.data.length === 0) {
        client.log.logAndReply(message, `Nenhum jogo encontrado com esse nome`);
        return;
    }

    const gameName = result.data[0].game_name;
    const releaseDate = result.data[0].release_world;
    const url = `https://howlongtobeat.com/game/${result.data[0].game_id}`;
    const hours = {
        main: convertToHours(result.data[0].comp_main),
        plus: convertToHours(result.data[0].comp_plus),
        full: convertToHours(result.data[0].comp_100),
        all: convertToHours(result.data[0].comp_all)
    };

    client.log.logAndReply(message, `
        Tempo médio para completar ${gameName} (${releaseDate}):
        História principal: ${hours.main} hrs,
        Conteúdo secundário: ${hours.plus} hrs,
        Complecionista: ${hours.full} hrs,
        Todos os estilos: ${hours.all} hrs.
        ${url}
    `.replace(/\n/g, ' '));
}   

howLongToBeatCommand.aliases = ['howlongtobeat', 'hltb'];

module.exports = {
    howLongToBeatCommand,
};