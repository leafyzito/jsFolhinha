const path = require("path");

async function getItadPrices(gameId) {
  const api_url = `https://api.isthereanydeal.com/games/overview/v2?key=${process.env.ISTHEREANYDEAL_API_KEY}&country=BR`;
  const res = await fb.got(api_url, {
    method: "POST",
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
    },
    json: [gameId],
  });
  if (!res || res.length == 0) {
    return null;
  }

  const currency = res.prices[0].current.price.currency;
  const currentPrice = res.prices[0].current.price.amount;
  const lowestPrice = res.prices[0].lowest.price.amount;
  const shopName = res.prices[0].current.shop.name;
  return { currency, currentPrice, lowestPrice, shopName };
}

async function getItadInfo(game) {
  const api_url = `https://api.isthereanydeal.com/games/search/v1?key=${
    process.env.ISTHEREANYDEAL_API_KEY
  }&title=${encodeURIComponent(game)}`;

  const res = await fb.got(api_url);
  if (!res || res.length == 0) {
    return null;
  }
  const gameId = res[0].id;
  const gameTitle = res[0].title;
  const gameSlug = res[0].slug;
  const itadLink = `https://isthereanydeal.com/game/${gameSlug}/info/`;

  const prices = await getItadPrices(gameId);

  return { gameId, gameTitle, gameSlug, itadLink, prices };
}

const isThereAnyDealCommand = async (message) => {
  const targetGame = message.args[1] ? message.args.slice(1).join(" ") : null;
  if (!targetGame) {
    return {
      reply: `Use o formato: ${message.prefix}deal <jogo>`,
    };
  }
  const itad = await getItadInfo(targetGame);
  if (!itad) {
    return { reply: "Nenhum jogo encontrado com esse nome" };
  }

  return {
    reply: `Menor preço atual de "${itad.gameTitle}": ${
      itad.prices.currentPrice + " " + itad.prices.currency
    } na loja ${itad.prices.shopName} • Menor preço de sempre: ${
      itad.prices.lowestPrice + " " + itad.prices.currency
    } • ${itad.itadLink}`,
  };
};

isThereAnyDealCommand.commandName = "isthereanydeal";
isThereAnyDealCommand.aliases = ["isthereanydeal", "itad", "deal"];
isThereAnyDealCommand.shortDescription =
  "Mostra o menor preço do momento de um jogo";
isThereAnyDealCommand.cooldown = 5000;
isThereAnyDealCommand.cooldownType = "channel";
isThereAnyDealCommand.whisperable = true;
isThereAnyDealCommand.description = `Mostra o menor preço do momento e o menor preço histórico de um jogo de acordo com o isthereanydeal.com`;
isThereAnyDealCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/src/commands/${__dirname
  .split(path.sep)
  .pop()}/${__filename.split(path.sep).pop()}`;

module.exports = {
  isThereAnyDealCommand,
};
