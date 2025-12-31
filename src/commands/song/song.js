const { Api } = require("@statsfm/statsfm.js");
const statsfm = new Api();

const path = require("path");
async function getLastfmRecentStream(lastfmUser) {
  const api_url = `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${lastfmUser}&limit=1&api_key=${process.env.LASTFM_API_KEY}&format=json`;

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

  if (data.recenttracks.track.length === 0) {
    return false; // for case of new accounts or idk
  }

  const currentTrack = data.recenttracks.track[0];
  const isNowPlaying =
    currentTrack["@attr"] && currentTrack["@attr"].nowplaying
      ? currentTrack["@attr"].nowplaying
      : false;

  const songArtist = currentTrack.artist["#text"];
  const songName = currentTrack.name;
  const albumName = currentTrack.album["#text"];
  const timestamp = currentTrack.date ? currentTrack.date.uts : null;

  return { isNowPlaying, songArtist, songName, albumName, timestamp };
}

async function getStatsfmRecentStream(statsfmUser) {
  const res = await statsfm.users.recentlyStreamed(statsfmUser);

  const songArtist = res[0].track.artists[0].name;
  const songName = res[0].track.name;
  const albumName = res[0].track.albums[0].name;
  const timestamp = res[0].endTime;

  return { isNowPlaying: null, songArtist, songName, albumName, timestamp };
}

async function getStatsfmStats(statsfmUser) {
  const res = await statsfm.users.stats(statsfmUser);

  if (!res) {
    return null;
  }

  const streams = res.count;
  const durationMinutes = Math.floor(res.durationMs / 60000);
  const uniqueTracks = res.cardinality.tracks;
  const uniqueArtists = res.cardinality.artists;
  const uniqueAlbums = res.cardinality.albums;

  return {
    streams,
    durationMinutes,
    uniqueTracks,
    uniqueArtists,
    uniqueAlbums,
  };
}

const songCommand = async (message) => {
  const songTarget =
    message.args[1]?.replace(/^@/, "") || message.senderUsername;

  // MARKER: set
  if (songTarget.toLowerCase() === "set") {
    const userToSet = message.args[2]?.replace(/^@/, "").toLowerCase() || null;
    if (!userToSet) {
      return {
        reply: `Você precisa especificar o nome do usuário do Last.fm que deseja configurar. Se estiver com dúvidas sobre o comando, acesse https://folhinhabot.com/comandos/song 😁`,
      };
    }

    if (userToSet.startsWith("statsfm:")) {
      const statsFmUserExists = await getStatsfmRecentStream(
        userToSet.replace(/^statsfm:/, "")
      );
      if (statsFmUserExists === null) {
        return {
          reply: `O usuário ${userToSet.replace(
            /^statsfm:/,
            ""
          )} não existe no Stats.fm. Se estiver com dúvidas sobre o comando, acesse https://folhinhabot.com/comandos/song 😁`,
        };
      }

      // check if lastfm user is already set in db
      const matchFromDb = await fb.db.get("lastfm", {
        twitch_uid: message.senderUserID,
      });
      if (matchFromDb) {
        // if already set, update
        await fb.db.update(
          "lastfm",
          { twitch_uid: message.senderUserID },
          {
            $set: {
              statsfm_user: userToSet.replace(/^statsfm:/, ""),
              use_statsfm: true,
            },
          }
        );
      } else {
        // if not set, insert
        await fb.db.insert("lastfm", {
          twitch_uid: message.senderUserID,
          lastfm_user: null,
          statsfm_user: userToSet.replace(/^statsfm:/, ""),
          use_statsfm: true,
        });
      }

      const emote = await fb.emotes.getEmoteFromList(
        message.channelName,
        ["joia", "jumilhao"],
        "👍"
      );
      return {
        reply: `Usuário do Stats.fm configurado com sucesso ${emote}`,
      };
    }

    // check if lastfm user exists
    const lastfmUserExists = await getLastfmRecentStream(userToSet);
    if (lastfmUserExists === null) {
      return {
        reply: `O usuário ${userToSet} não existe no Last.fm. Se estiver com dúvidas sobre o comando, acesse https://folhinhabot.com/comandos/song 😁`,
      };
    }

    // check if lastfm user is already set in db
    const matchFromDb = await fb.db.get("lastfm", {
      twitch_uid: message.senderUserID,
    });
    if (matchFromDb) {
      // if already set, update
      await fb.db.update(
        "lastfm",
        { twitch_uid: message.senderUserID },
        { $set: { lastfm_user: userToSet, use_statsfm: false } }
      );
    } else {
      // if not set, insert
      await fb.db.insert("lastfm", {
        twitch_uid: message.senderUserID,
        lastfm_user: userToSet,
        use_statsfm: false,
      });
    }

    const emote = await fb.emotes.getEmoteFromList(
      message.channelName,
      ["joia", "jumilhao"],
      "👍"
    );
    return {
      reply: `Usuário do Last.fm configurado com sucesso ${emote}`,
    };
  }

  // MARKER: stats
  if (songTarget.toLowerCase() === "stats") {
    const statsTarget =
      message.args[2]?.replace(/^@/, "").toLowerCase() ||
      message.senderUsername;
    const statsTargetId =
      statsTarget.toLowerCase() != message.senderUsername
        ? (await fb.api.helix.getUserByUsername(statsTarget))?.id
        : message.senderUserID;

    const statsTargetUser = await fb.db.get("lastfm", {
      twitch_uid: statsTargetId,
    });
    if (!statsTargetUser) {
      return {
        reply: `O usuário ${statsTarget} não registou a sua conta no bot. Se estiver com dúvidas sobre o comando, acesse https://folhinhabot.com/comandos/song 😁`,
      };
    }

    if (!statsTargetUser.use_statsfm || !statsTargetUser.statsfm_user) {
      return {
        reply: `O comando de estatísticas é limitado a usuários que usam Stats.fm. Se estiver com dúvidas sobre o comando, acesse https://folhinhabot.com/comandos/song 😁`,
      };
    }

    const statsInfo = await getStatsfmStats(statsTargetUser.statsfm_user);
    if (statsInfo === null) {
      return {
        reply: `O usuário ${statsTarget} não está registrado no Stats.fm. Se estiver com dúvidas sobre o comando, acesse https://folhinhabot.com/comandos/song 😁`,
      };
    }

    return {
      reply: `🎵 Estatísticas de músicas ouvidas por ${statsTarget}:
       ${statsInfo.streams.toLocaleString("fr-FR")} streams 
       ● ${statsInfo.durationMinutes.toLocaleString("fr-FR")} minutos 
       ● ${statsInfo.uniqueTracks.toLocaleString("fr-FR")} músicas únicas 
       ● ${statsInfo.uniqueArtists.toLocaleString("fr-FR")} artistas únicos 
      ● ${statsInfo.uniqueAlbums.toLocaleString("fr-FR")} álbums únicos`,
    };
  }

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

  let songInfo;
  if (isStatsFm) {
    songInfo = await getStatsfmRecentStream(fmUser);
  } else {
    songInfo = await getLastfmRecentStream(fmUser);
  }
  if (songInfo === null) {
    return {
      reply: `O usuário ${songTarget} não está registrado no ${
        isStatsFm ? "Stats.fm" : "Last.fm"
      }. Se estiver com dúvidas sobre o comando, acesse https://folhinhabot.com/comandos/song 😁`,
    };
  }

  if (songInfo === false) {
    return {
      reply: `${
        songTarget != message.senderUsername ? songTarget : "Você"
      } ainda não escutou nenhuma música`,
    };
  }

  if (songInfo === "private") {
    return {
      reply: `O usuário ${songTarget} tem o perfil privado no Last.fm (se não for o caso, avise o dev)`,
    };
  }

  if (songInfo?.isNowPlaying) {
    const emote = await fb.emotes.getEmoteFromList(
      message.channelName,
      ["catjam", "alienpls", "banger", "jamgie", "lebronjam", "jammies"],
      ""
    );

    return {
      reply: `${
        songTarget != message.senderUsername ? songTarget : "Você"
      } está ouvindo ${songInfo.songArtist} - ${songInfo.songName} ${
        songInfo.albumName != "" ? `(Álbum: ${songInfo.albumName})` : ""
      } ${emote}`,
    };
  } else {
    const timeAgo = fb.utils.relativeTime(songInfo.timestamp, true, true);
    return {
      reply: `${
        songTarget != message.senderUsername ? songTarget : "Você"
      } ouviu por último ${songInfo.songArtist} - ${songInfo.songName} ${
        songInfo.albumName != "" ? `(Álbum: ${songInfo.albumName})` : ""
      } há ${timeAgo}`,
    };
  }
};

songCommand.commandName = "song";
songCommand.aliases = ["song"];
songCommand.shortDescription = "Veja qual música alguém está ouvindo";
songCommand.cooldown = 5000;
songCommand.cooldownType = "channel";
songCommand.whisperable = true;
songCommand.description = `Mostre qual música você está ouvindo ou veja qual música alguém está ouvindo, de acordo com o Last.fm ou Stats.fm

Se você não tem a sua conta do Last.fm configurada, faça-o para poder usar este comando:
Crie uma conta no Last.fm: https://last.fm/join
Conecte a plataforma que usa para ouvir música ao Last.fm: https://www.last.fm/about/trackmymusic

Por fim, use o comando !song set {nome_da_sua_conta_do_lastfm} para configurar a sua conta no bot

Caso já tenha a sua conta configurada, use !song set {nome_da_sua_conta_do_lastfm}
Caso prefira usar uma conta Stats.fm, use !song set statsfm:{nome_da_sua_conta_do_statsfm} (requer uma conta Plus no Stats.fm)

Pode também ver qual música outra pessoa está ouvindo usando !song {nome_da_pessoa}

Se você estiver usando Stats.fm, você pode ver as suas estatísticas de músicas ouvidas usando !song stats (requer uma conta Plus no Stats.fm)`;
songCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/src/commands/${__dirname
  .split(path.sep)
  .pop()}/${__filename.split(path.sep).pop()}`;

module.exports = {
  songCommand,
};
