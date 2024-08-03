const { processCommand } = require("../../utils/processCommand.js");
const { shortenUrl, timeSinceDT } = require("../../utils/utils.js");

async function getLive(liveTarget) {
    const api_url = `https://api.ivr.fi/v2/twitch/user?login=${liveTarget}`
    const response = await fetch(api_url);
    const data = await response.json();

    if (data.length === 0) { return null; }

    const lastStreamDate = data[0].lastBroadcast.startedAt !== null ? data[0].lastBroadcast.startedAt : null;

    if (!lastStreamDate) {
        //  never streamed
        return 'never streamed';
    }

    const isLive = data[0].stream !== null ? data[0].stream : false;

    if (isLive) {
        return {
            isLive: true,
            title: data[0].stream.title,
            game: data[0].stream.game.displayName,
            viewers: data[0].stream.viewersCount,
            startedAt: data[0].stream.createdAt,
        };
    }

    return {
        isLive: false,
        lastStreamDate: lastStreamDate,
        lastStreamTitle: data[0].lastBroadcast.title
    };
}

const liveCommand = async (client, message) => {
    message.command = 'live';
    if (!await processCommand(5000, 'channel', message, client)) return;

    const liveTarget = message.messageText.split(' ')[1]?.replace(/^@/, '') || message.channelName;
    const live = await getLive(liveTarget);

    if (!live) {
        client.log.logAndReply(message, `O canal ${liveTarget} não existe`);
        return;
    }

    if (live === 'never streamed') {
        client.log.logAndReply(message, `O canal ${liveTarget} nunca fez live`);
        return;
    }

    if (!live.isLive) {
        const timeSinceLastStream = timeSinceDT(live.lastStreamDate)[0];
        client.log.logAndReply(message, `Não tem live no ${liveTarget} há ${timeSinceLastStream} - título: ${live.lastStreamTitle}`);
        return;
    }

    if (live.isLive) {
        const liveUrl = liveTarget !== message.channelName ? ` | https://twitch.tv/${liveTarget}` : '';
        client.log.logAndReply(message, `${liveTarget} está agora fazendo live de ${live.game} com ${live.viewers} viewers - ${live.title}${liveUrl}`);
        return;
    }
};


module.exports = {
    liveCommand: liveCommand,
    liveAliases: ['live']
};
