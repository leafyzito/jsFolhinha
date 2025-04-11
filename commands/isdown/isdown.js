const { domainToASCII } = require('node:url');
const { processCommand } = require("../../utils/processCommand.js");
const { timeSince } = require("../../utils/utils.js");

async function checkSite(url) {
    const url_ascii = domainToASCII(url);
    const api_url = `https://sitecheck.sucuri.net/api/v3/?scan=${url_ascii}`;
    const response = await fetch(api_url);

    if (!response.ok) {
        return null;
    }

    const data = await response.json();
    return data;
}

const isDownCommand = async (client, message) => {
    message.command = 'isdown';
    if (!await processCommand(5000, 'channel', message, client)) return;

    const targetUrl = message.messageText.split(" ").slice(1)[0];
    if (!targetUrl) {
        client.log.logAndReply(message, `Use o formato: ${message.commandPrefix}isdown <url>`);
        return;
    }

    const check = await checkSite(targetUrl);
    if (!check) {
        client.log.logAndReply(message, `⚠️ Erro ao verificar o status do site, tente novamente mais tarde`);
        return;
    }

    const { scan, warnings } = check;
    if (scan?.error) {
        client.log.logAndReply(message, `⚠️ Não foi possível verificar o status do site! ${scan.error}`);
        return;
    }

    const lastScan = new Date(scan.last_scan);
    const timeSinceLastScan = timeSince(Math.floor(lastScan.getTime() / 1000));
    console.log(scan.last_scan, lastScan, timeSinceLastScan);

    if (Array.isArray(warnings?.scan_failed)) {
        const error = warnings.scan_failed[0].msg;
        if (error === "Host not found") {
            client.log.logAndReply(message, `⚠️ O site fornecido não foi encontrado!`);
            return;
        }
        else {
            client.log.logAndReply(message, `⚠️ O site está fora do ar: ${error ?? "(N/A)"}. Última verificação há ${timeSinceLastScan}.`);
            return;
        }
    }

    client.log.logAndReply(message, `✅ O site está online e disponível. Última verificação há ${timeSinceLastScan}.`);
    return;
};

isDownCommand.commandName = 'isdown';
isDownCommand.aliases = ['isdown', 'down', 'sitecheck'];
isDownCommand.shortDescription = 'Verifica se um site está online ou offline';
isDownCommand.cooldown = 5000;
isDownCommand.whisperable = true;
isDownCommand.description = `Verifica se um site está fora do ar ou se é só você que não consegue ver o site, de acordo com a API do Sucuri`;
isDownCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/${isDownCommand.commandName}/${isDownCommand.commandName}.js`;

module.exports = {
    isDownCommand: isDownCommand,
};

