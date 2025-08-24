const durationRegex =
  /P((?<days>\d+)D)?(T((?<hours>\d+)H)?((?<minutes>\d+)M)?((?<seconds>\d+)S)?)?/;

function parseVideoDuration(string) {
  const match = string.match(durationRegex);
  if (!match || !match.groups) {
    return "";
  }

  const { days, hours, minutes, seconds } = match.groups;
  const totalSeconds =
    Number(days ?? 0) * 86400 +
    Number(hours ?? 0) * 3600 +
    Number(minutes ?? 0) * 60 +
    Number(seconds ?? 0);

  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s
      .toString()
      .padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}

async function searchYtVideos(query, maxResults = 5) {
  console.log(process.env.GOOGLE_YOUTUBE_SEARCH_API_KEY);
  try {
    const searchParams = new URLSearchParams({
      key: process.env.GOOGLE_YOUTUBE_SEARCH_API_KEY,
      q: query,
      type: "video",
      part: "snippet",
      maxResults: maxResults,
      sort: "relevance",
    });

    const data = await fb.got(
      `https://www.googleapis.com/youtube/v3/search?${searchParams}`
    );

    if (!data) {
      throw new Error("YouTube API Error: Failed to fetch data");
    }

    const videoList = data.items.map((item) => ({
      id: item.id.videoId,
      title: item.snippet.title,
    }));

    return videoList.length > 0 ? videoList[0] : null;
  } catch (error) {
    throw new Error(`Failed to search YouTube: ${error.message}`);
  }
}

async function getYtVideoDetails(videoId) {
  const searchParams = new URLSearchParams({
    key: process.env.GOOGLE_YOUTUBE_SEARCH_API_KEY,
    id: videoId,
    part: "snippet,statistics,contentDetails",
  });

  const data = await fb.got(
    `https://www.googleapis.com/youtube/v3/videos?${searchParams}`
  );

  if (!data || !data.items || data.items.length === 0) {
    return null;
  }

  const videoDetails = {
    id: data.items[0].id,
    title: data.items[0].snippet.title,
    link: `https://youtu.be/${data.items[0].id}`,
    author: data.items[0].snippet.channelTitle,
    publishedAt: new Date(data.items[0].snippet.publishedAt).toLocaleDateString(
      "en-GB"
    ),
    duration:
      data.items[0].contentDetails.duration == "P0D"
        ? ""
        : parseVideoDuration(data.items[0].contentDetails.duration),
    views: Number(data.items[0].statistics.viewCount).toLocaleString("fr-FR"),
  };
  return videoDetails;
}

async function getVideo(query) {
  const video = await searchYtVideos(query);
  if (video === null) {
    return null;
  }
  const videoDetails = await getYtVideoDetails(video.id);
  if (videoDetails === null) {
    return null;
  }
  return videoDetails;
}

const youtubeSearchCommand = async (message) => {
  const query = message.args.slice(1).join(" ").trim();
  if (query === "" || query === null) {
    return {
      reply: `Use o formato: ${message.prefix}youtubesearch <qualquer coisa>`,
    };
  }

  const ytVideo = await getVideo(query);
  if (ytVideo === null) {
    return {
      reply: `Não encontrei nenhum vídeo sobre essa pesquisa`,
    };
  }

  const durationPart =
    ytVideo.duration === "" ? "" : `, duração: ${ytVideo.duration}`;
  const reply = `"${ytVideo.title}" de ${ytVideo.author}, ${ytVideo.views} views, publicado em ${ytVideo.publishedAt}${durationPart} ${ytVideo.link}`;

  return {
    reply: reply,
  };
};

youtubeSearchCommand.commandName = "youtubesearch";
youtubeSearchCommand.aliases = ["youtubesearch", "ytsearch", "yts", "ys"];
youtubeSearchCommand.shortDescription = "Pesquise vídeos no YouTube";
youtubeSearchCommand.cooldown = 5000;
youtubeSearchCommand.cooldownType = "channel";
youtubeSearchCommand.whisperable = true;
youtubeSearchCommand.description = `Pesquise vídeos no YouTube e veja detalhes sobre eles, como título, autor, views, data de publicação e duração`;
youtubeSearchCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/src/commands/${__dirname
  .split("/")
  .pop()}/${__filename.split("/").pop()}`;

module.exports = {
  youtubeSearchCommand,
};
