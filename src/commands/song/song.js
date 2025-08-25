async function getSongInfo(lastfmUser) {
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

const songCommand = async (message) => {
  const songTarget =
    message.args[1]?.replace(/^@/, "") || message.senderUsername;

  if (songTarget.toLowerCase() === "set") {
    const lastfmUserToSet = message.args[2]?.replace(/^@/, "") || null;
    if (!lastfmUserToSet) {
      return {
        reply: `Você precisa especificar o nome do usuário do Last.fm que deseja configurar. Se estiver com dúvidas sobre o comando, acesse https://folhinhabot.com/comandos/song 😁`,
      };
    }
    // check if lastfm user exists
    const lastfmUserExists = await getSongInfo(lastfmUserToSet);
    if (lastfmUserExists === null) {
      return {
        reply: `O usuário ${lastfmUserToSet} não existe no Last.fm. Se estiver com dúvidas sobre o comando, acesse https://folhinhabot.com/comandos/song 😁`,
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
        { $set: { lastfm_user: lastfmUserToSet } }
      );
    } else {
      // if not set, insert
      await fb.db.insert("lastfm", {
        twitch_uid: message.senderUserID,
        lastfm_user: lastfmUserToSet,
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

  const songTargetId =
    songTarget.toLowerCase() != message.senderUsername
      ? (await fb.api.helix.getUserByUsername(songTarget))?.id
      : message.senderUserID;

  let lastfmUser = songTarget;
  if (songTargetId) {
    const matchFromDb = await fb.db.get("lastfm", { twitch_uid: songTargetId });
    if (matchFromDb) {
      lastfmUser = matchFromDb.lastfm_user;
    }
  }

  const songInfo = await getSongInfo(lastfmUser);
  if (songInfo === null) {
    return {
      reply: `O usuário ${songTarget} não está registrado no Last.fm. Se estiver com dúvidas sobre o comando, acesse https://folhinhabot.com/comandos/song 😁`,
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

  if (songInfo.isNowPlaying) {
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
songCommand.description = `Mostre qual música você está ouvindo ou veja qual música alguém está ouvindo, de acordo com o Last.fm

Se você não tem a sua conta do Last.fm configurada, faça-o para poder usar este comando:
Crie uma conta no Last.fm: https://last.fm/join
Conecte a plataforma que usa para ouvir música ao Last.fm: https://www.last.fm/about/trackmymusic

Por fim, use o comando !song set {nome_da_sua_conta_do_lastfm} para configurar a sua conta no bot

Caso já tenha a sua conta configurada, use !song set {nome_da_sua_conta_do_lastfm}
Pode também ver qual música outra pessoa está ouvindo usando !song {nome_da_pessoa}`;
songCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/src/commands/${__dirname
  .split("/")
  .pop()}/${__filename.split("/").pop()}`;

module.exports = {
  songCommand,
};
