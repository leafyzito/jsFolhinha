const { processCommand } = require("../../utils/processCommand.js");
const { timeSinceDT } = require("../../utils/utils.js");

async function getFA(user, channel) {
    const api_url = `https://api.ivr.fi/v2/twitch/subage/${user}/${channel}`;
    const response = await fetch(api_url);
    const data = await response.json();

    if ("statusCode" in data) {
        return `${channel} não existe`;
    }

    const followDate = data.followedAt;

    if (followDate == null) {
        return `${user} não segue ${channel}`;
    }

    const formattedTime = timeSinceDT(followDate)[0];
    const followDateFormatted = timeSinceDT(followDate)[1];

    return [formattedTime, followDateFormatted];
}

const followAgeCommand = async (client, message) => {
    message.command = 'followage';
    if (!await processCommand(5000, 'channel', message, client)) return;

    let faTarget = message.senderUsername;
    let faChannelTarget = message.channelName;

    const args = message.messageText.split(' ');

    if (args.length === 2) {
        faChannelTarget = args[1].replace(/^@/, '');
    } else if (args.length === 3) {
        faTarget = args[1].replace(/^@/, '');
        faChannelTarget = args[2].replace(/^@/, '');
    }

    if (faTarget === faChannelTarget) {
        client.log.logAndReply(message, 'Stare ?');
        return;
    }

    const faResult = await getFA(faTarget, faChannelTarget);

    if (faResult.includes("não existe")) {
        client.log.logAndReply(message, faResult);
        return;
    }

    if (faResult.includes("não segue")) {
        client.log.logAndReply(message, faResult);
        return;
    }

    const faMessage = `${faTarget === message.senderUsername ? 'Você' : `${faTarget}`} segue ${faChannelTarget} há ${faResult[0]} (${faResult[1]})`;
    client.log.logAndReply(message, faMessage);
    return;
};

followAgeCommand.commandName = 'followage';
followAgeCommand.aliases = ['followage', 'fa'];
followAgeCommand.shortDescription = 'Mostra há quanto tempo um usuário segue um canal';
followAgeCommand.cooldown = 5000;
followAgeCommand.whisperable = false;
followAgeCommand.description = `Mostra há quanto tempo um usuário segue um canal, tendo várias formas de o fazer:
Apenas !followage: O bot vai responder com a quantidade de tempo que o usuário que executou o comando segue o canal no qual o comando foi executado
!followage @usuário: O bot vai responder com a quantidade de tempo que o usuário que executou o comando segue o canal que foi fornecido
!followage @usuário1 @usuário2: O bot vai responder com a quantidade de tempo que o @usuário1 segue @usuário2`;
followAgeCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/${followAgeCommand.commandName}/${followAgeCommand.commandName}.js`;

module.exports = {
    followAgeCommand,
};