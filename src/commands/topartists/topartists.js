const { Api } = require("@statsfm/statsfm.js");
const statsfm = new Api();

const path = require("path");
async function getLastfmTop5(lastfmUser) {
  const api_url = `https://ws.audioscrobbler.com/2.0/?method=user.gettopartists&user=${lastfmUser}&limit=5&api_key=${process.env.LASTFM_API_KEY}&format=json`;

  const data = await fb.got(api_url, { retry: { limit: 3 } });
  if (!data) {
    return null;
  }

  if (data.error) {
    if (data.error === 6) {
      return null;
    }
    if (data.error === 17) {
      return "private";
    }
  }

  if (data.topartists.artist.length === 0) {
    return false; // for case of new accounts or idk
  }

  const top5Artists = data.topartists.artist.map((artist) => ({
    artistName: artist.name,
    playCount: artist.playcount,
  }));

  return top5Artists;
}

async function getStatsfmTop5(statsfmUser) {
  const res = await statsfm.users.topArtists(statsfmUser, { limit: 5 });

  if (!res) {
    return null;
  }

  const top5Artists = res.map((a) => ({
    artistName: a.artist.name,
    playCount: a.streams,
  }));

  return top5Artists;
}

const topArtistsCommand = async (message) => {
  const artistTarget =
    message.args[1]?.replace(/^@/, "") || message.senderUsername;

  const artistTargetId =
    artistTarget.toLowerCase() != message.senderUsername
      ? (await fb.api.helix.getUserByUsername(artistTarget))?.id
      : message.senderUserID;

  let fmUser = artistTarget;
  let isStatsFm = false;
  if (artistTargetId) {
    const matchFromDb = await fb.db.get("lastfm", {
      twitch_uid: artistTargetId,
    });
    if (matchFromDb) {
      if (matchFromDb.use_statsfm) {
        fmUser = matchFromDb.statsfm_user;
        isStatsFm = true;
      } else {
        fmUser = matchFromDb.lastfm_user;
      }
    }
  }

  let top5Artists;
  if (isStatsFm) {
    top5Artists = await getStatsfmTop5(fmUser);
  } else {
    top5Artists = await getLastfmTop5(fmUser);
  }
  if (top5Artists === null) {
    return {
      reply: `O usuário ${artistTarget} não está registrado no ${
        isStatsFm ? "Stats.fm" : "Last.fm"
      }. Para entender como configurar a sua conta, acesse https://folhinhabot.com/comandos/song 😁`,
    };
  }

  if (top5Artists === false) {
    return {
      reply: `${
        artistTarget != message.senderUsername ? artistTarget : "Você"
      } ainda não escutou nenhum artista`,
    };
  }

  if (top5Artists === "private") {
    return {
      reply: `O usuário ${artistTarget} tem o perfil privado no Last.fm (se não for o caso, avise o dev)`,
    };
  }

  const top5String = top5Artists
    .map((artist) => `${artist.artistName} (${artist.playCount})`)
    .join(", ");
  return {
    reply: `Top 5 artistas mais ouvidos de ${artistTarget}: ${top5String}`,
  };
};

topArtistsCommand.commandName = "topartists";
topArtistsCommand.aliases = ["topartists", "topartist"];
topArtistsCommand.shortDescription =
  "Veja os 5 artistas mais ouvidos de alguém";
topArtistsCommand.cooldown = 5000;
topArtistsCommand.cooldownType = "channel";
topArtistsCommand.whisperable = true;
topArtistsCommand.description = `Mostre os 5 artistas mais ouvidos de alguém, de acordo com o Last.fm ou Stats.fm

Para ver mais sobre como configurar a sua conta, acesse https://folhinhabot.com/comandos/song`;
topArtistsCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/src/commands/${__dirname
  .split(path.sep)
  .pop()}/${__filename.split(path.sep).pop()}`;

module.exports = {
  topArtistsCommand,
};
