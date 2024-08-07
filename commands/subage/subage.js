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

subAgeCommand.aliases = ['subage', 'sa'];

module.exports = {
    subAgeCommand,
};