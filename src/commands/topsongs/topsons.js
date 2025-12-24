const path = require("path");
async function getLastfmTop5(lastfmUser) {
  const api_url = `https://ws.audioscrobbler.com/2.0/?method=user.gettoptracks&user=${lastfmUser}&limit=5&api_key=${process.env.LASTFM_API_KEY}&format=json`;

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

  if (data.toptracks.track.length === 0) {
    return false; // for case of new accounts or idk
  }

  const top5Songs = data.toptracks.track.map((track) => ({
    songArtist: track.artist.name,
    songName: track.name,
    playCount: track.playcount,
  }));

  return top5Songs;
}

async function getStatsfmTop5(statsfmUser) {
  const api_url = `https://api.stats.fm/api/v1/users/${statsfmUser}/top/tracks?limit=5`;

  const res = await fb.got(api_url, {
    retry: { limit: 3 },
  });
  if (!res) {
    return null;
  }

  const top5Songs = res.items.map((track) => ({
    songArtist: track.track.artists[0].name,
    songName: track.track.name,
    playCount: track.streams,
  }));

  return top5Songs;
}

const topSongsCommand = async (message) => {
  const songTarget =
    message.args[1]?.replace(/^@/, "") || message.senderUsername;

  const songTargetId =
    songTarget.toLowerCase() != message.senderUsername
      ? (await fb.api.helix.getUserByUsername(songTarget))?.id
      : message.senderUserID;

  let fmUser = songTarget;
  let isStatsFm = false;
  if (songTargetId) {
    const matchFromDb = await fb.db.get("lastfm", { twitch_uid: songTargetId });
    if (matchFromDb) {
      if (matchFromDb.use_statsfm) {
        fmUser = matchFromDb.statsfm_user;
        isStatsFm = true;
      } else {
        fmUser = matchFromDb.lastfm_user;
      }
    }
  }

  let top5Tracks;
  if (isStatsFm) {
    top5Tracks = await getStatsfmTop5(fmUser);
  } else {
    top5Tracks = await getLastfmTop5(fmUser);
  }
  if (top5Tracks === null) {
    return {
      reply: `O usuário ${songTarget} não está registrado no ${
        isStatsFm ? "Stats.fm" : "Last.fm"
      }. Para entender como configurar a sua conta, acesse https://folhinhabot.com/comandos/song 😁`,
    };
  }

  if (top5Tracks === false) {
    return {
      reply: `${
        songTarget != message.senderUsername ? songTarget : "Você"
      } ainda não escutou nenhuma música`,
    };
  }

  if (top5Tracks === "private") {
    return {
      reply: `O usuário ${songTarget} tem o perfil privado no Last.fm (se não for o caso, avise o dev)`,
    };
  }

  const top5String = top5Tracks
    .map(
      (track) => `${track.songArtist} - ${track.songName} (${track.playCount})`
    )
    .join(", ");
  return {
    reply: `Top 5 músicas mais ouvidas de ${songTarget}: ${top5String}`,
  };
};

topSongsCommand.commandName = "topsongs";
topSongsCommand.aliases = ["topsongs", "topsong"];
topSongsCommand.shortDescription = "Veja as 5 músicas mais ouvidas de alguém";
topSongsCommand.cooldown = 5000;
topSongsCommand.cooldownType = "channel";
topSongsCommand.whisperable = true;
topSongsCommand.description = `Mostre as 5 músicas mais ouvidas de alguém, de acordo com o Last.fm ou Stats.fm

Para ver mais sobre como configurar a sua conta, acesse https://folhinhabot.com/comandos/song`;
topSongsCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/src/commands/${__dirname
  .split(path.sep)
  .pop()}/${__filename.split(path.sep).pop()}`;

module.exports = {
  topSongsCommand,
};
