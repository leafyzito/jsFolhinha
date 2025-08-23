async function getVideoDownload(urlToDownload) {
  const apiUrl = "http://localhost:9000/"; // https://cobalt.tools/ local instance
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    Authorization: "ApiKey " + process.env.COBALT_API_KEY,
  };
  const payload = {
    url: urlToDownload,
  };

  try {
    const response = await fb.got(apiUrl, {
      method: "POST",
      headers: headers,
      json: payload,
    });

    if (!response) {
      console.log(`Error: API response failed`);
      return "apiError";
    }

    const resData = response;
    const resUrl = resData.url;

    // Download the video content
    const videoResponse = await fb.got(resUrl);
    if (!videoResponse) {
      return null;
    }

    // Upload to feridinha
    const fileName = `video_${Date.now()}.mp4`;
    const feridinhaUrl = await fb.api.feridinha.uploadVideo(
      videoResponse,
      fileName
    );

    if (!feridinhaUrl) {
      console.log(
        "Failed to upload to feridinha, falling back to original URL"
      );
      return resUrl;
    }

    return feridinhaUrl;
  } catch (e) {
    console.log(`erro no getVideoDownload: ${e}`);
    try {
      const errorText = e.message;
      if ("connect to the service api" in errorText) {
        return "apiError";
      } else {
        return null;
      }
    } catch (e2) {
      console.log(`erro no try-catch do getVideoDownload: ${e2}`);
      return null;
    }
  }
}

async function getAudioDownload(urlToDownload) {
  const apiUrl = "http://localhost:9000/"; // https://cobalt.tools/ local instance
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    Authorization: "ApiKey " + process.env.COBALT_API_KEY,
  };
  const payload = {
    url: urlToDownload,
    downloadMode: "audio",
  };

  try {
    const response = await fb.got(apiUrl, {
      method: "POST",
      headers: headers,
      json: payload,
    });

    if (!response) {
      return null;
    }

    const resData = response;
    const resUrl = resData.url;

    // Download the audio content
    const audioResponse = await fb.got(resUrl);
    if (!audioResponse) {
      return null;
    }

    // Upload to feridinha
    const fileName = `audio_${Date.now()}.mp3`;
    const feridinhaUrl = await fb.api.feridinha.uploadAudio(
      audioResponse,
      fileName
    );

    if (!feridinhaUrl) {
      console.log(
        "Failed to upload to feridinha, falling back to original URL"
      );
      return resUrl;
    }

    return feridinhaUrl;
  } catch (e) {
    console.log(`erro no getAudioDownload: ${e}`);
    return null;
  }
}

const downloadCommand = async (message) => {
  if (message.args.length < 2) {
    return {
      reply: `Use o formato: ${message.prefix}download (opcional: video/audio) <link para fazer download>`,
    };
  }

  if (
    (message.args.length === 2 || message.args[1].toLowerCase() === "video") &&
    message.args[1].toLowerCase() !== "audio"
  ) {
    const urlToDownload = message.args[2] ? message.args[2] : message.args[1];
    if (urlToDownload === "video" || urlToDownload === "audio") {
      return {
        reply: `Use o formato: ${message.prefix}download video <link para fazer download>`,
      };
    }

    const downloadUrl = await getVideoDownload(urlToDownload);
    if (downloadUrl === "apiError") {
      return {
        reply: `Não foi possível fazer o download, o serviço para esse site não está funcionando no momento. Tente novamente mais tarde`,
      };
    } else if (!downloadUrl) {
      return {
        reply: `Não foi possível fazer o download desse link`,
      };
    }
    return {
      reply: `💾 ${downloadUrl}`,
    };
  }

  if (message.args[1].toLowerCase() === "audio") {
    const urlToDownload = message.args[2];
    if (!urlToDownload) {
      return {
        reply: `Use o formato: ${message.prefix}download audio <link para fazer download>`,
      };
    }

    const downloadUrl = await getAudioDownload(urlToDownload);
    if (downloadUrl === "apiError") {
      return {
        reply: `Não foi possível fazer o download, o serviço para esse site não está funcionando no momento. Tente novamente mais tarde`,
      };
    } else if (!downloadUrl) {
      return {
        reply: `Não foi possível fazer o download desse link`,
      };
    }
    return {
      reply: `💾 ${downloadUrl}`,
    };
  }

  return {
    reply: `Use o formato: ${message.prefix}download (opcional: video/audio) <link para fazer download>`,
  };
};

downloadCommand.commandName = "download";
downloadCommand.aliases = ["download", "dl"];
downloadCommand.shortDescription = "Faz o download de algum vídeo/audio";
downloadCommand.cooldown = 5000;
downloadCommand.cooldownType = "channel";
downloadCommand.whisperable = true;
downloadCommand.description = `Faça o download de mídias através do bot
• Exemplo: !download https://www.youtube.com/watch?v=dQw4w9WgXcQ

Pode também fazer download apenas do audio (mp3), utilizando o formato !download audio {link}
• Exemplo: !download audio https://www.youtube.com/watch?v=dQw4w9WgXcQ

Sites mais famosos suportados: Youtube, Instagram, Facebook, Reddit, Tiktok, Twitter, clipes da Twitch
Para mais informações sobre a API utilizada, acesse https://github.com/imputnet/cobalt/tree/main/api#supported-services`;
downloadCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/src/commands/${__dirname
  .split("/")
  .pop()}/${__filename.split("/").pop()}`;

module.exports = {
  downloadCommand,
};
