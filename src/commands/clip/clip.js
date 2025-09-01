async function getClip(channelName, forceTwitchClipFlag) {
  const targetId = (await fb.api.helix.getUserByUsername(channelName))?.id;
  if (!targetId) {
    return null;
  }
  if (!forceTwitchClipFlag) {
    const clipperClip = await fb.api.clipper.makeClip(channelName);
    if (clipperClip) {
      return clipperClip;
    }
  }

  const helixClip = await fb.api.helix.createClip(targetId);
  if (helixClip === "error") {
    // 403 or 503 (internal errors)
    return "error";
  }
  if (helixClip) {
    // Add a 1 second timeout, to give time for the clip to be created correctly
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return helixClip;
  }

  return null;
}

const clipCommand = async (message) => {
  const targetChannel =
    message.args[1]?.replace(/^@/, "") || message.channelName;

  // flag to force the creation of the clip using the twitch api over makeClip
  const forceTwitchClipFlag = message.args.includes("-twitch");
  const clip = await getClip(targetChannel, forceTwitchClipFlag);

  if (!clip) {
    return {
      reply: `O canal ${targetChannel} não existe ou não está em live`,
    };
  } else if (clip === "error") {
    return {
      reply: `⚠️ Erro ao criar clip, tente novamente`,
    };
  }
  if (clip.clipUrl) {
    return {
      reply: `🎬 ${clip.clipUrl}`,
    };
  }

  if (clip.makeClipUrl) {
    return {
      reply: `🎬 ${clip.makeClipUrl}`,
    };
  }
  //   return {
  //     reply: `🎬 ${clip}`,
  //   };
};

clipCommand.commandName = "clip";
clipCommand.aliases = ["clip", "clipe"];
clipCommand.shortDescription = "Crie um clip de alguma live";
clipCommand.cooldown = 5000;
clipCommand.cooldownType = "channel";
clipCommand.whisperable = false;
clipCommand.description = `Crie um clip de alguma live. Se nenhum canal for especificado, o comando irá criar um clip do canal onde o comando foi executado
• Exemplo: !clip - O bot vai criar um clip do canal onde o comando foi executado
• Exemplo: !clip @leafyzito - O bot vai criar um clip do canal do usuário @leafyzito, caso ele esteja em live
• Exemplo: !clip @leafyzito -twitch - O bot vai criar um clip do canal do usuário @leafyzito, caso ele esteja em live, usando a api do twitch ao invés de upar o clip para o feridinha`;
clipCommand.code = `https://github.com/fchstbot/jsFolhinha/blob/main/src/commands/${__dirname
  .split("/")
  .pop()}/${__filename.split("/").pop()}`;

module.exports = {
  clipCommand,
};
