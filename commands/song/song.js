import { processCommand } from '../../utils/processCommand.js';
import { timeSince } from '../../utils/utils.js';

async function getSongInfo(lastfmUser) {
    const api_url = `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${lastfmUser}&limit=1&api_key=${process.env.LASTFM_API_KEY}&format=json`;
    const response = await fetch(api_url);
    const data = await response.json();

    if (data.error) {
        if (data.error === 6) {
            return null;
        }
        if (data.error === 17) {
            return 'private';
        }
    }

    if (data.recenttracks.track.length === 0) {
        return false; // for case of new accounts or idk
    }

    const currentTrack = data.recenttracks.track[0];
    const isNowPlaying = currentTrack['@attr'] ? currentTrack['@attr'].nowplaying : false;

    const songArtist = currentTrack.artist['#text'];
    const songName = currentTrack.name;
    const albumName = currentTrack.album['#text'];
    const timestamp = currentTrack.date ? currentTrack.date.uts : null;

    return { isNowPlaying, songArtist, songName, albumName, timestamp };
}

const songCommand = async (client, message) => {
    message.command = 'song';
    if (!(await processCommand(5000, 'channel', message, client))) return;

    const songTarget =
        message.messageText.split(' ')[1]?.replace(/^@/, '') || message.senderUsername;

    if (songTarget.toLowerCase() === 'set') {
        const lastfmUserToSet = message.messageText.split(' ')[2].replace(/^@/, '') || null;
        if (!lastfmUserToSet) {
            client.log.logAndReply(
                message,
                `Você precisa especificar o nome do usuário do Last.fm que deseja configurar. Se estiver com dúvidas sobre o comando, acesse https://folhinhabot.com/comandos/song 😁`
            );
            return;
        }
        // check if lastfm user exists
        const lastfmUserExists = await getSongInfo(lastfmUserToSet);
        if (lastfmUserExists === null) {
            client.log.logAndReply(
                message,
                `O usuário ${lastfmUserToSet} não existe no Last.fm. Se estiver com dúvidas sobre o comando, acesse https://folhinhabot.com/comandos/song 😁`
            );
            return;
        }

        // check if lastfm user is already set in db
        const matchFromDb = await client.db.get('lastfm', { twitch_uid: message.senderUserID });
        if (matchFromDb.length > 0) {
            // if already set, update
            await client.db.update(
                'lastfm',
                { twitch_uid: message.senderUserID },
                { $set: { lastfm_user: lastfmUserToSet } }
            );
        } else {
            // if not set, insert
            await client.db.insert('lastfm', {
                twitch_uid: message.senderUserID,
                lastfm_user: lastfmUserToSet,
            });
        }

        const emote = await client.emotes.getEmoteFromList(
            message.channelName,
            ['joia', 'jumilhao'],
            '👍'
        );
        client.log.logAndReply(message, `Usuário do Last.fm configurado com sucesso ${emote}`);
        return;
    }
    const songTargetId =
        songTarget.toLowerCase() != message.senderUsername
            ? await client.getUserID(songTarget)
            : message.senderUserID;
    // if (!songTargetId) {
    //     console.log(`Esse usuário não existe`);
    //     // client.log.logAndReply(message, `Esse usuário não existe`);
    //     return;
    // }

    let lastfmUser = songTarget;
    if (songTargetId) {
        const matchFromDb = await client.db.get('lastfm', { twitch_uid: songTargetId });
        if (matchFromDb.length > 0) {
            lastfmUser = matchFromDb[0].lastfm_user;
        }
    }

    const songInfo = await getSongInfo(lastfmUser);
    if (songInfo === null) {
        client.log.logAndReply(
            message,
            `O usuário ${songTarget} não está registrado no Last.fm. Se estiver com dúvidas sobre o comando, acesse https://folhinhabot.com/comandos/song 😁`
        );
        return;
    }

    if (songInfo === false) {
        client.log.logAndReply(
            message,
            `${songTarget != message.senderUsername ? songTarget : 'Você'} ainda não escutou nenhuma música`
        );
        return;
    }

    if (songInfo === 'private') {
        client.log.logAndReply(
            message,
            `O usuário ${songTarget} tem o perfil privado no Last.fm (se não for o caso, avise o dev)`
        );
        return;
    }

    if (songInfo.isNowPlaying) {
        client.log.logAndReply(
            message,
            `${songTarget != message.senderUsername ? songTarget : 'Você'} está ouvindo ${songInfo.songArtist} - ${songInfo.songName} ${songInfo.albumName != '' ? `(Álbum: ${songInfo.albumName})` : ''}`
        );
    } else {
        const timeAgo = timeSince(songInfo.timestamp);
        client.log.logAndReply(
            message,
            `${songTarget != message.senderUsername ? songTarget : 'Você'} ouviu por último ${songInfo.songArtist} - ${songInfo.songName} ${songInfo.albumName != '' ? `(Álbum: ${songInfo.albumName})` : ''} há ${timeAgo}`
        );
    }
    return;
};

songCommand.commandName = 'song';
songCommand.aliases = ['song'];
songCommand.shortDescription = 'Veja qual música alguém está ouvindo';
songCommand.cooldown = 5000;
songCommand.whisperable = true;
songCommand.description = `Mostre qual música você está ouvindo ou veja qual música alguém está ouvindo, de acordo com o Last.fm

Se você não tem a sua conta do Last.fm configurada, faça-o para poder usar este comando:
Crie uma conta no <a href="https://last.fm/join" target="_blank" style="color: #67e8f9">Last.fm</a>
Conecte a plataforma que usa para ouvir música ao Last.fm <a href="https://www.last.fm/about/trackmymusic" target="_blank" style="color: #67e8f9">aqui (https://www.last.fm/about/trackmymusic)</a>
Por fim, use o comando !song set {nome_da_sua_conta_do_lastfm} para configurar a sua conta no bot

Caso já tenha a sua conta configurada, use !song set {nome_da_sua_conta_do_lastfm}
Pode também ver qual música outra pessoa está ouvindo usando !song {nome_da_pessoa}`;
songCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/${songCommand.commandName}/${songCommand.commandName}.js`;

export { songCommand };
