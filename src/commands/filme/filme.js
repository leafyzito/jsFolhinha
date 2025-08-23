function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

async function getOMDBd(targetTitle) {
  const res = await fb.got(
    `https://www.omdbapi.com/?t=${targetTitle}&apikey=${process.env.OMDB_API_KEY}`
  );

  if (!res) {
    return null;
  }

  if (res.Response === "False") {
    return null;
  }

  const movieData = {
    title: res.Title,
    year: res.Year,
    plot: res.Plot.length > 100 ? res.Plot.substring(0, 100) + "..." : res.Plot,
    rated: res.Rated,
    released: res.Released,
    runtime: res.Runtime,
    type: capitalize(res.Type),
    genre: res.Genre,
    grossed: res.BoxOffice,
    ratings:
      res.Ratings.length > 0
        ? res.Ratings.map((rating) => `${rating.Source}: ${rating.Value}`).join(
            ", "
          )
        : null,
    imdbID: res.imdbID,
  };

  // filter out N/A values
  return Object.fromEntries(
    Object.entries(movieData).filter(([, value]) => value && value !== "N/A")
  );
}

const filmeCommand = async (message) => {
  const targetTitle = message.args.slice(1).join(" ").trim();
  if (!targetTitle) {
    return {
      reply: `Use o formato: ${message.prefix}filme <filme ou série>`,
    };
  }

  const movie = await getOMDBd(targetTitle);
  if (!movie) {
    return {
      reply: "⚠️ Filme não encontrado",
    };
  }

  const replyParts = [];

  if (movie.title) replyParts.push(`Título: ${movie.title} (${movie.year})`);
  if (movie.plot) replyParts.push(`Sinopse: ${movie.plot}`);
  if (movie.rated) replyParts.push(`Classificação: ${movie.rated}`);
  if (movie.released) replyParts.push(`Lançamento: ${movie.released}`);
  if (movie.runtime) replyParts.push(`Duração: ${movie.runtime}`);
  if (movie.type) replyParts.push(`Tipo: ${movie.type}`);
  if (movie.genre) replyParts.push(`Gênero: ${movie.genre}`);
  if (movie.grossed) replyParts.push(`Bilheteria: ${movie.grossed}`);
  if (movie.ratings) replyParts.push(`Avaliações: ${movie.ratings}`);
  if (movie.imdbID)
    replyParts.push(`IMDd: https://www.imdb.com/title/${movie.imdbID}`);

  let replyMsg = replyParts.join(" ● ");
  if (replyMsg.length > 490) {
    replyMsg = await fb.utils.manageLongResponse(replyMsg);
  }

  return {
    reply: replyMsg,
  };
};

filmeCommand.commandName = "filme";
filmeCommand.aliases = ["filme", "movie", "serie", "show"];
filmeCommand.shortDescription = "Veja informações sobre um filme ou série";
filmeCommand.cooldown = 5000;
filmeCommand.cooldownType = "channel";
filmeCommand.whisperable = true;
filmeCommand.description = `Veja informações como sinopse, classificação, duração, gênero, bilheteria e avaliações de um filme ou série

Tente usar o nome exato do filme ou série`;
filmeCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/src/commands/${__dirname
  .split("/")
  .pop()}/${__filename.split("/").pop()}`;

module.exports = {
  filmeCommand,
};
