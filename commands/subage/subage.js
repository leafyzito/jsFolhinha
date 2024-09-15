const { processCommand } = require("../../utils/processCommand.js");

async function getSubAge(user, channel) {
    const api_url = `https://api.ivr.fi/v2/twitch/subage/${user}/${channel}`;
    const response = await fetch(api_url);
    const data = await response.json();

    if ("statusCode" in data) {
        return `Um dos usuários inseridos não existe`;
    }

    let output = '';
    let isActiveSub = data.meta !== null;

    if (!isActiveSub) {
        output = `${user} não é sub de ${channel}`;
    } else {
        let months = data.cumulative.months;
        let subType = '';

        if (data.meta.type === 'paid') {
            let subTier = data.meta.tier;
            subType = `Tier ${subTier}`;
        } else if (data.meta.type === 'prime') {
            subType = 'Prime';
        } else if (data.meta.type === 'gift') {
            let subTier = data.meta.tier;
            subType = `de Presente Tier ${subTier}`;
        }

        output = `${user} é sub de ${channel} há ${months} meses com Subscrição ${subType}`;
    }

    let hasSubbed = data.cumulative !== null;

    if (!hasSubbed) {
        output += ' e nunca foi antes';
    }

    if (!isActiveSub && hasSubbed) {
        let oldMonths = data.cumulative.months;
        output += `, mas já foi por ${oldMonths} meses`;
    }

    return output;
}

const subAgeCommand = async (client, message) => {
    message.command = 'followage';
    if (!await processCommand(5000, 'channel', message, client)) return;

    let saTarget = message.senderUsername;
    let saChannelTarget = message.channelName;

    const args = message.messageText.split(' ');

    if (args.length === 2) {
        saChannelTarget = args[1].replace(/^@/, '');
    } else if (args.length === 3) {
        saTarget = args[1].replace(/^@/, '');
        saChannelTarget = args[2].replace(/^@/, '');
    }

    const saResult = await getSubAge(saTarget, saChannelTarget);

    if (saResult.includes("não existe")) {
        client.log.logAndReply(message, saResult);
        return;
    }

    client.log.logAndReply(message, saResult);
};

subAgeCommand.commandName = 'subage';
subAgeCommand.aliases = ['subage', 'sa'];
subAgeCommand.shortDescription = 'Mostra há quanto tempo um usuário é sub de algum canal';
subAgeCommand.cooldown = 5000;
subAgeCommand.whisperable = false;
subAgeCommand.description = 'Uso: !subage <usuário> <canal>; Resposta esperada: {usuário} é sub de {canal} há {tempo}';
subAgeCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/${subAgeCommand.commandName}/${subAgeCommand.commandName}.js`;

subAgeCommand.description = `Mostra há quanto tempo um usuário é sub de um canal, tendo várias formas de o fazer:
Apenas !subage: O bot vai responder com a quantidade de tempo que o usuário que executou o comando é sub do canal no qual o comando foi executado
!subage @usuário: O bot vai responder com a quantidade de tempo que o usuário que executou o comando é sub do canal que foi fornecido
!subage @usuário1 @usuário2: O bot vai responder com a quantidade de tempo que o @usuário1 é sub do @usuário2`;


module.exports = {
    subAgeCommand,
};