const path = require("path");
// Need to fetch a randomized hash to attach to the API request
// Solution from Supinic - https://github.com/Supinic/supibot/blob/master/commands/howlongtobeat/index.ts

// eslint-disable-next-line no-unused-vars
let HLTB_JS_FILE_HASH_KEY = "hltb-file-hash";
// eslint-disable-next-line no-unused-vars
let HLTB_ENDPOINT_HASH_KEY = "hltb-endpoint-hash";

const FILE_PREFIX = "_next/static/chunks/pages";
const FILE_HASH_REGEX = /static\/chunks\/pages\/(_app-\w+?\.js)/;
const ENDPOINT_HASH_REGEX =
  /\/api\/seek\/".concat\("(\w+)"\)\s*(.concat\("(\w+)"\))?/;

async function fetchFileHash() {
  const body = await fb.got("https://howlongtobeat.com/", {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36",
    },
    responseType: "text",
  });
  if (!body) {
    return null;
  }

  const match = body.match(FILE_HASH_REGEX);
  if (!match) {
    return null;
  }

  HLTB_JS_FILE_HASH_KEY = match[1];

  return match[1];
}

async function fetchEndpointHash(fileHash) {
  const body = await fb.got(
    `https://howlongtobeat.com/${FILE_PREFIX}/${fileHash}`,
    {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36",
      },
      responseType: "text",
    }
  );
  if (!body) {
    return null;
  }

  const match = body.match(ENDPOINT_HASH_REGEX);
  if (!match) {
    return null;
  }

  HLTB_ENDPOINT_HASH_KEY = match[1];

  return match[3] ? `${match[1]}${match[3]}` : match[1];
}

async function hltbSearch(query) {
  const fileHash = await fetchFileHash();
  if (!fileHash) {
    throw new Error("file error");
  }

  const endpointHash = await fetchEndpointHash(fileHash);
  if (!endpointHash) {
    throw new Error("endpoint error");
  }

  const response = await fb.got(
    `https://howlongtobeat.com/api/seek/${endpointHash}`,
    {
      method: "POST",
      headers: {
        Referer: "https://howlongtobeat.com/",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36",
        "Content-Type": "application/json",
      },
      json: {
        searchType: "games",
        searchTerms: [...query],
        searchPage: 1,
        searchOptions: {
          filter: "",
          games: {
            gameplay: { perspective: "", flow: "", genre: "", difficulty: "" },
            modifier: "",
            platform: "",
            rangeCategory: "main",
            rangeTime: { min: null, max: null },
            rangeYear: { min: "", max: "" },
            sortCategory: "popular",
            userId: 0,
          },
          randomizer: 0,
          sort: 0,
        },
        size: 1,
      },
    }
  );

  if (!response) {
    return "HTTP request failed";
  }

  return response;
}

function convertToHours(time) {
  return Math.round((time / 3600) * 10 ** 1) / 10 ** 1;
}

const howLongToBeatCommand = async (message) => {
  const query = message.args.slice(1);

  if (query.length === 0) {
    return {
      reply: `Use o formato: ${message.prefix}howlongtobeat <jogo>`,
    };
  }

  try {
    const result = await hltbSearch(query);

    if (result === "HTTP request failed") {
      return {
        reply: `Erro ao buscar o jogo. Tente novamente mais tarde.`,
      };
    }

    if (!result.data || result.data.length === 0) {
      return {
        reply: `Nenhum jogo encontrado com esse nome`,
      };
    }

    const gameName = result.data[0].game_name;
    const releaseDate = result.data[0].release_world;
    const url = `https://howlongtobeat.com/game/${result.data[0].game_id}`;
    const hours = {
      main: convertToHours(result.data[0].comp_main),
      plus: convertToHours(result.data[0].comp_plus),
      full: convertToHours(result.data[0].comp_100),
      all: convertToHours(result.data[0].comp_all),
    };

    return {
      reply: `Tempo médio para completar ${gameName} (${releaseDate}): História principal: ${hours.main} hrs, Conteúdo secundário: ${hours.plus} hrs, Complecionista: ${hours.full} hrs, Todos os estilos: ${hours.all} hrs. ${url}`,
    };
  } catch (error) {
    fb.discord.logError("Error in howlongtobeat:", error);
    return {
      reply: `Erro ao buscar o jogo. Tente novamente`,
    };
  }
};

howLongToBeatCommand.commandName = "howlongtobeat";
howLongToBeatCommand.aliases = ["howlongtobeat", "hltb"];
howLongToBeatCommand.shortDescription =
  "Mostra o tempo que leva para um jogo ser completado";
howLongToBeatCommand.cooldown = 5000;
howLongToBeatCommand.cooldownType = "channel";
howLongToBeatCommand.whisperable = true;
howLongToBeatCommand.description = `Descubra o tempo que leva para um jogo ser completado em média
• Exemplo: !howlongtobeat Hollow Knight - O bot vai responder com o tempo que leva para completar o jogo fornecido juntamente com um link para a página do jogo no site howlongtobeat.com`;
howLongToBeatCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/src/commands/${__dirname.split(path.sep).pop()}/${__filename.split(path.sep).pop()}`;

module.exports = {
  howLongToBeatCommand,
};
