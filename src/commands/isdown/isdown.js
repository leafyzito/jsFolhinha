const path = require("path");
const { domainToASCII } = require("node:url");

async function checkSite(url) {
  const url_ascii = domainToASCII(url);
  const data = await fb.got(
    `https://sitecheck.sucuri.net/api/v3/?scan=${url_ascii}`
  );

  if (!data) {
    return null;
  }

  return data;
}

const isDownCommand = async (message) => {
  const targetUrl = message.args[1];
  if (!targetUrl) {
    return {
      reply: `Use o formato: ${message.prefix}isdown <url>`,
    };
  }

  const check = await checkSite(targetUrl);
  if (!check) {
    return {
      reply: `⚠️ Erro ao verificar o status do site, tente novamente mais tarde`,
    };
  }

  const { scan, warnings } = check;
  if (scan?.error) {
    return {
      reply: `⚠️ Não foi possível verificar o status do site: ${scan.error}`,
    };
  }

  const lastScan = new Date(scan.last_scan);
  const timeSinceLastScan = fb.utils.relativeTime(
    Math.floor(lastScan.getTime() / 1000),
    true,
    true
  );
  console.log(scan.last_scan, lastScan, timeSinceLastScan);

  if (Array.isArray(warnings?.scan_failed)) {
    const error = warnings.scan_failed[0].msg;
    if (error === "Host not found") {
      return {
        reply: `⚠️ O site fornecido não foi encontrado`,
      };
    } else {
      return {
        reply: `⚠️ O site está fora do ar: ${
          error ?? "(N/A)"
        }. Última verificação há ${timeSinceLastScan}.`,
      };
    }
  }

  return {
    reply: `✅ O site está online e disponível. Última verificação há ${timeSinceLastScan}.`,
  };
};

isDownCommand.commandName = "isdown";
isDownCommand.aliases = ["isdown", "down", "sitecheck"];
isDownCommand.shortDescription = "Verifica se um site está online ou offline";
isDownCommand.cooldown = 5000;
isDownCommand.cooldownType = "channel";
isDownCommand.whisperable = true;
isDownCommand.description = `Verifica se um site está fora do ar ou se é só você que não consegue ver o site, de acordo com a API do Sucuri`;
isDownCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/src/commands/${__dirname.split(path.sep).pop()}/${__filename.split(path.sep).pop()}`;

module.exports = {
  isDownCommand: isDownCommand,
};
