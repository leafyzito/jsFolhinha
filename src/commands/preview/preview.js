// TODO: fix
async function makePreview(channelName) {
  try {
    const response = await fb.got(
      `http://localhost:8989/preview/${channelName}`
    );

    if (!response) {
      return null;
    }

    // Note: This would need file system operations
    // For now, we'll return a placeholder
    console.log("Preview creation would happen here");
    return null;
  } catch (error) {
    console.log("Error making preview:", error);
    return null;
  }
}

async function getImage(url) {
  const response = await fb.got(url);
  if (!response) {
    return null;
  }

  return await fb.api.feridinha.uploadImage(response, "preview.jpg");
}

async function getOfflineImage(previewTarget) {
  const api_url = `https://api.twitch.tv/helix/users?login=${previewTarget}`;
  const headers = {
    "Client-ID": process.env.BOT_CLIENT_ID,
    Authorization: `Bearer ${process.env.BOT_OAUTH_TOKEN}`,
  };
  const data = await fb.got(api_url, { headers });

  if (!data || data.data.length === 0) {
    return null;
  }

  const offlineImage = data.data[0].offline_image_url;
  if (!offlineImage || offlineImage === "") {
    return null;
  }

  return await getImage(offlineImage);
}

async function getPreview(previewTarget) {
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

  // make preview
  const preview = await makePreview(previewTarget);
  if (preview) {
    return { isLive: true, image: preview };
  }

  const thumbPreviewRaw = data.data[0].thumbnail_url;
  const thumbPreview = thumbPreviewRaw.replace("{width}x{height}", "1280x720");
  const thumbPreviewUrl = await getImage(thumbPreview);

  return { isLive: true, image: thumbPreviewUrl };
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
