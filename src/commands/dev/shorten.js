const shortenCommand = async (message) => {
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
shortenCommand.cooldown = 5_000;
shortenCommand.cooldownType = "user";
shortenCommand.permissions = ["admin"];
shortenCommand.whisperable = false;
shortenCommand.flags = ["dev"];

module.exports = { shortenCommand };
