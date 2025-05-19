const { processCommand } = require("../../utils/processCommand.js");
const { timeSince } = require("../../utils/utils.js");

const stalkCommand = async (client, message) => {
    message.command = 'stalk';
    if (!await processCommand(5000, 'channel', message, client)) return;

    if (message.messageText.split(' ').length === 1) {
        client.log.logAndReply(message, `Use o formato: ${message.commandPrefix}stalk <usuário>`);
        return;
    }

    const targetUser = message.messageText.split(' ')[1].toLowerCase().replace(/^@/, '')

    if (targetUser === message.senderUsername) {
        client.log.logAndReply(message, `Você tá aqui mesmo Stare`);
        return;
    }

    if (['folhinha', 'folhinhabot'].includes(targetUser)) {
        client.log.logAndReply(message, `Tá tentando me stalkear pra quê Stare`);
        return;
    }

    const targetUserId = await client.getUserID(targetUser);
    if (!targetUserId) {
        client.log.logAndReply(message, `Esse usuário não existe`);
        return;
    }

    const userInfo = await client.db.get('users', { userid: targetUserId });
    if (userInfo.length === 0) {
        client.log.logAndReply(message, `Nunca vi esse usuário`);
        return;
    }

    if (userInfo[0].optoutStalk) {
        client.log.logAndReply(message, `Esse usuário optou por não ser alvo de comandos stalk 🚫`);
        return;
    }

    var lsChannel = userInfo[0].lsChannel;
    const lsChannelId = await client.getUserID(lsChannel);
    const lsChannelInfo = await client.db.get('users', { userid: lsChannelId });
    if (lsChannelInfo.length !== 0 && lsChannelInfo[0].optoutOwnChannel && lsChannel != message.channelName) {
        lsChannel = '***';
    }

    const lsDate = userInfo[0].lsDate;
    const lsMessage = userInfo[0].lsMessage;
    const timeSinceLs = timeSince(lsDate);

    client.log.logAndReply(message, `${targetUser} foi visto pela última vez há ${timeSinceLs} em #${lsChannel} - ${lsMessage}`);
};

stalkCommand.commandName = 'stalk';
stalkCommand.aliases = ['stalk'];
stalkCommand.shortDescription = 'Veja onde um usuário falou pela última vez e o que ele disse';
stalkCommand.cooldown = 5000;
stalkCommand.whisperable = false;
stalkCommand.description = `Pesquise há quanto tempo um usuário foi visto pela última vez, em algum canal onde o Folhinha esteja presente, em qual canal e o conteúdo da mensagem
Se quiser desabilitar a função de outras pessoas usarem este comando em você, use !optout stalk`;
stalkCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/${stalkCommand.commandName}/${stalkCommand.commandName}.js`;

module.exports = {
    stalkCommand,
};
