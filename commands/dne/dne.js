const { processCommand } = require("../../utils/processCommand.js");
const { shortenUrl } = require("../../utils/utils.js");

async function getDne() {
    const url = "https://this-person-does-not-exist.com/new";
    const response = await fetch(url);

    if (response.status === 200) {
        const data = await response.json();
        const img = data.src;
        const result = `https://this-person-does-not-exist.com${img}`;
        const shortResult = await shortenUrl(result);
        return shortResult;
    }
    return null;
}

const dneCommand = async (client, message) => {
    message.command = 'dne';
    if (!await processCommand(5000, 'channel', message, client)) return;

    const dne = await getDne();

    if (!dne) {
        client.log.logAndReply(message, `Erro ao obter imagem, tente novamente`);
        return;
    }

    client.log.logAndReply(message, dne);

};

dneCommand.aliases = ['dne', 'thispersondoesnotexist', 'doesnotexist'];

module.exports = {
    dneCommand,
};
