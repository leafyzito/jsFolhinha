const shortenCommand = async (message) => {
  message.command = "dev shorten";

  const url = message.args[1];
  if (!url) {
    return {
      reply: `Use o formato ${message.prefix}shorten <url>`,
    };
  }

  try {
    const shortenedUrl = await fb.utils.shortenUrl(url);
    return {
      reply: `🔗 ${shortenedUrl}`,
    };
  } catch (err) {
    return {
      reply: `Erro ao encurtar URL: ${err.message}`,
    };
  }
};

// Command metadata
shortenCommand.commandName = "shorten";
shortenCommand.aliases = ["shorten"];
shortenCommand.shortDescription = "Shorten a URL";
shortenCommand.cooldown = 0;
shortenCommand.cooldownType = "user";
shortenCommand.permissions = ["admin"];
shortenCommand.whisperable = false;

module.exports = { shortenCommand };
