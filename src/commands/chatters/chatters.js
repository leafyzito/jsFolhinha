async function getChatters(channel) {
  const api_url = "https://api.fuchsty.com/twitch/chatters/" + channel;
  const response = await fb.request(api_url);
  const data = await response.body.json();

  if ("error" in data) {
    return "erro";
  }

  const count = data.count;
  if (count === 0) {
    return null;
  }

  const broadcaster = data.chatters.broadcasters || [];
  const mods = data.chatters.moderators || [];
  const vips = data.chatters.vips || [];
  const viewers = data.chatters.viewers || [];

  return [broadcaster, mods, vips, viewers, count];
}

const chattersCommand = async (message) => {
  const targetChannel =
    message.args[1]?.replace(/^@/, "") || message.channelName;
  const chattersRes = await getChatters(targetChannel);

  if (chattersRes === "erro") {
    return {
      reply: `Esse usuário não existe`,
    };
  }

  if (!chattersRes) {
    return {
      reply: `Não há chatters em ${targetChannel}`,
    };
  }

  let streamer = chattersRes[0];
  let mods = chattersRes[1];
  let vips = chattersRes[2];
  let viewers = chattersRes[3];
  const count = chattersRes[4];

  streamer = streamer.join("\n");
  mods = mods.sort().join("\n");
  vips = vips.sort().join("\n");
  viewers = viewers.sort().join("\n");

  const finalList = `Total de chatters em #${targetChannel}: ${count}\n\nStreamer:\n${streamer}\n\nModeradores: (${mods.length})\n${mods}\n\nVips: (${vips.length})\n${vips}\n\nChatters: (${viewers.length})\n${viewers}`;

  const gistUrl = await fb.api.github.createGist(finalList);

  if (count > 99) {
    return {
      reply: `Existem ${count} chatters em #${targetChannel}: ${gistUrl} (devido a limitações da Twitch, esta lista contém apenas 100 chatters)`,
    };
  }

  return {
    reply: `Existem ${count} chatters em #${targetChannel}: ${gistUrl}`,
  };
};

chattersCommand.commandName = "chatters";
chattersCommand.aliases = ["chatters"];
chattersCommand.shortDescription = "Mostra a lista de chatters de algum canal";
chattersCommand.cooldown = 5000;
chattersCommand.cooldownType = "channel";
chattersCommand.whisperable = false;
chattersCommand.description = `Exibe uma lista de usuários totais online no canal e suas devidas categorias (Streamer, Moderadores, VIPs, Chatters)
O comando funcionará mesmo em canais que o Folhinha não esteja presente
• Exemplo: !chatters - Exibe a lista de chatters do canal atual
• Exemplo: !chatters {canal} - Exibe a lista de chatters do canal escolhido`;
chattersCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/src/commands/${__dirname
  .split("/")
  .pop()}/${__filename.split("/").pop()}`;

module.exports = {
  chattersCommand,
};
