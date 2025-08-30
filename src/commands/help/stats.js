const statsCommand = async () => {
  const uptime = fb.utils.relativeTime(fb.startTime, true);
  const channelsCount = fb.twitch.anonClient.currentChannels.length || 0;
  const usedRam = process.memoryUsage().heapUsed / 1024 / 1024;

  return {
    reply: `Uptime: ${uptime} | Canais: ${channelsCount} | RAM: ${
      Math.round(usedRam * 100) / 100
    }mb`,
  };
};

statsCommand.commandName = "stats";
statsCommand.aliases = ["stats", "ping", "uptime"];
statsCommand.shortDescription = "Mostra algumas informações sobre o bot";
statsCommand.cooldown = 5000;
statsCommand.cooldownType = "channel";
statsCommand.whisperable = true;
statsCommand.description =
  "Exibe algumas informações sobre o bot, como uptime, quantidade de canais ativos e RAM utilizada";
statsCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/src/commands/${__dirname
  .split("/")
  .pop()}/${__filename.split("/").pop()}`;

module.exports = { statsCommand };
