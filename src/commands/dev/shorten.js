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
shortenCommand.shortDescription = "[DEV] Encurta uma URL";
shortenCommand.cooldown = 5_000;
shortenCommand.cooldownType = "user";
shortenCommand.permissions = ["admin"];
shortenCommand.whisperable = false;
shortenCommand.flags = ["dev"];
shortenCommand.description = `Encurta um link fornecendo a URL como argumento

• Exemplo: !shorten https://folhinhabot.com - Retorna um link encurtado`;

module.exports = { shortenCommand };
