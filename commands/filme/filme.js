const { processCommand } = require("../../utils/processCommand.js");
const { capitalize, manageLongResponse } = require("../../utils/utils.js");

async function getOMDBd(targetTitle) {
    const response = await fetch(`https://www.omdbapi.com/?t=${targetTitle}&apikey=${process.env.OMDB_API_KEY}`);
    const data = await response.json();

    if (data.Response === "False") {
        return null;
    }

    const movieData = {
        title: data.Title,
        plot: data.Plot.length > 100 ? data.Plot.substring(0, 100) + '...' : data.Plot,
        rated: data.Rated,
        released: data.Released,
        runtime: data.Runtime,
        type: capitalize(data.Type),
        genre: data.Genre,
        grossed: data.BoxOffice,
        ratings: data.Ratings.length > 0 ? data.Ratings.map(rating => `${rating.Source}: ${rating.Value}`).join(", ") : null,
        imdbID: data.imdbID
    };

    // filter out N/A values
    return Object.fromEntries(
        Object.entries(movieData).filter(([_, value]) => value && value !== "N/A")
    );
}

const filmeCommand = async (client, message) => {
    message.command = 'filme';
    if (!await processCommand(5000, 'channel', message, client)) return;

    const targetTitle = message.messageText.split(' ').slice(1).join(' ').trim();
    const movie = await getOMDBd(targetTitle);

    if (!movie) {
        client.log.logAndReply(message, "⚠️ Filme não encontrado");
        return;
    }

    const replyParts = [];

    if (movie.title) replyParts.push(`Título: ${movie.title}`);
    if (movie.plot) replyParts.push(`Sinopse: ${movie.plot}`);
    if (movie.rated) replyParts.push(`Classificação: ${movie.rated}`);
    if (movie.released) replyParts.push(`Lançamento: ${movie.released}`);
    if (movie.runtime) replyParts.push(`Duração: ${movie.runtime}`);
    if (movie.type) replyParts.push(`Tipo: ${movie.type}`);
    if (movie.genre) replyParts.push(`Gênero: ${movie.genre}`);
    if (movie.grossed) replyParts.push(`Bilheteria: ${movie.grossed}`);
    if (movie.ratings) replyParts.push(`Avaliações: ${movie.ratings}`);
    if (movie.imdbID) replyParts.push(`IMDd: https://www.imdb.com/title/${movie.imdbID}`);

    let reply = replyParts.join(' ● ');
    if (reply.length > 490) { reply = await manageLongResponse(reply); }
    client.log.logAndReply(message, reply);
    return;
};

filmeCommand.commandName = 'filme';
filmeCommand.aliases = ['filme', 'movie', 'serie', 'show'];
filmeCommand.shortDescription = 'Veja informações sobre um filme ou série';
filmeCommand.cooldown = 5000;
filmeCommand.whisperable = true;
filmeCommand.description = `Veja informações como sinopse, classificação, duração, gênero, bilheteria e avaliações de um filme ou série
Tente usar o nome exato do filme ou série`;
filmeCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/${filmeCommand.commandName}/${filmeCommand.commandName}.js`;

module.exports = {
    testeCommand: filmeCommand,
};
