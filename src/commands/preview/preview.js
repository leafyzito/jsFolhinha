// TODO: OK - test clipper api
async function getOfflineImage(previewTarget) {
  try {
    const userData = await fb.api.helix.getUserByUsername(previewTarget);

    if (
      !userData ||
      !userData.offlineImageUrl ||
      userData.offlineImageUrl === ""
    ) {
      return null;
    }

    return await fb.api.feridinha.uploadFromUrl(userData.offlineImageUrl);
  } catch (error) {
    console.log("Error getting offline image:", error);
    return null;
  }
}

async function getPreview(previewTarget) {
  // First try to use the clipper API's makePreview
  try {
    const result = await fb.api.clipper.makePreview(previewTarget);
    if (result && result.makePreviewUrl) {
      return { isLive: true, image: result.makePreviewUrl };
    }
  } catch (error) {
    console.log("Error making preview with clipper API:", error);
  }

  // If clipper API fails, fall back to Helix API
  const api_url = `https://api.twitch.tv/helix/streams?user_login=${previewTarget}`;
  const headers = {
    "Client-ID": process.env.BOT_CLIENT_ID,
    Authorization: `Bearer ${process.env.BOT_OAUTH_TOKEN}`,
  };

  const data = await fb.got(api_url, { headers });

  if (!data || "error" in data) {
    return "não existe";
  }

  if (data.data.length === 0) {
    // if offline, return the offline image
    const offlineImage = await getOfflineImage(previewTarget);
    return { isLive: false, image: offlineImage };
  }

  // Use Helix API thumbnail as fallback
  try {
    const thumbPreviewRaw = data.data[0].thumbnail_url;
    const thumbPreview = thumbPreviewRaw.replace(
      "{width}x{height}",
      "1280x720"
    );
    const thumbPreviewUrl = await fb.api.feridinha.uploadFromUrl(
      thumbPreview,
      "preview.jpg"
    );

    return { isLive: true, image: thumbPreviewUrl };
  } catch (error) {
    console.log("Error getting thumbnail preview:", error);
    return { isLive: true, image: null };
  }
}

const previewCommand = async (message) => {
  const previewTarget =
    message.args[1]?.replace(/^@/, "") || message.channelName;
  const preview = await getPreview(previewTarget);

  if (preview === "não existe") {
    return {
      reply: `O canal ${previewTarget} não existe`,
    };
  }

  if (!preview.isLive && preview.image === null) {
    return {
      reply: `O canal ${previewTarget} não está em live`,
    };
  }

  if (!preview.isLive && preview.image !== null) {
    return {
      reply: `O canal ${previewTarget} não está em live, aqui está a tela offline: ${preview.image}`,
    };
  }

  if (preview.isLive) {
    return {
      reply: `Preview da live de ${previewTarget}: ${preview.image}`,
    };
  }
};

previewCommand.commandName = "preview";
previewCommand.aliases = ["preview", "prev", "thumb", "thumbnail"];
previewCommand.shortDescription =
  "Mostra uma imagem do momento atual de uma live";
previewCommand.cooldown = 5000;
previewCommand.cooldownType = "channel";
previewCommand.whisperable = false;
previewCommand.description = `Exibe uma imagem do momento atual da live do canal fornecido ou a tela offline caso não esteja em live

• Exemplo: !preview omeiaum - Se o canal "omeiaum" estiver ao vivo, o bot vai enviar uma imagem do momento atual da live`;
previewCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/src/commands/${__dirname
  .split("/")
  .pop()}/${__filename.split("/").pop()}`;

module.exports = {
  previewCommand,
};
