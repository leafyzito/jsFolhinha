const { processCommand } = require("../../utils/processCommand.js");

const optoutCommand = async (client, message) => {
    message.command = 'optout';
    if (!await processCommand(5000, 'channel', message, client)) return;

    if (message.messageText.split(' ').length === 1) {
        client.log.logAndReply(message, `Use o formato ${message.commandPrefix}optout <lastseen/stalk>`);
        return;
    }

    const optoutTarget = message.messageText.split(' ')[1]?.toLowerCase();

    if (!['channel', 'canal', 'lastseen', 'ls', 'stalk', 'remind'].includes(optoutTarget)) {
        client.log.logAndReply(message, `Use o formato ${message.commandPrefix}optout <lastseen/stalk/remind>`);
        return;
    }

    if (['channel', 'canal'].includes(optoutTarget)) {
        if (!message.isStreamer) {
            client.log.logAndReply(message, `Apenas o streamer pode usar este comando`);
            return;
        }

        const channelOptout = await client.db.get('users', { userid: message.channelID });
        const currState = channelOptout[0].optoutOwnChannel;

        await client.db.update('users', { userid: message.channelID }, { $set: { optoutOwnChannel: !currState } });
        client.log.logAndReply(message, `A partir de agora o canal ${currState ? 'NÃO' : ''} será censurado em comandos stalk`);
        return;
    }

    if (['lastseen', 'ls'].includes(optoutTarget)) {
        const userOptout = await client.db.get('users', { userid: message.senderUserID });
        const currState = userOptout[0].optoutLs;

        await client.db.update('users', { userid: message.senderUserID }, { $set: { optoutLs: !currState } });
        client.log.logAndReply(message, `A partir de agora você ${!currState ? 'NÃO' : ''} pode ser alvo de comandos lastseen`);
        return;
    }

    if (['stalk'].includes(optoutTarget)) {
        const userOptout = await client.db.get('users', { userid: message.senderUserID });
        const currState = userOptout[0].optoutStalk;

        await client.db.update('users', { userid: message.senderUserID }, { $set: { optoutStalk: !currState } });
        client.log.logAndReply(message, `A partir de agora você ${!currState ? 'NÃO' : ''} pode ser alvo de comandos stalk`);
        return;
    }

    if (['remind'].includes(optoutTarget)) {
        const userOptout = await client.db.get('users', { userid: message.senderUserID });
        const currState = userOptout[0].optoutRemind;

        await client.db.update('users', { userid: message.senderUserID }, { $set: { optoutRemind: !currState } });
        client.log.logAndReply(message, `A partir de agora você ${!currState ? 'NÃO' : ''} pode ser alvo de comandos remind`);
        return;
    }

};

optoutCommand.commandName = 'optout';
optoutCommand.aliases = ['optout'];
optoutCommand.shortDescription = 'Opte fora de alguns comandos do bot';
optoutCommand.cooldown = 5000;
optoutCommand.whisperable = false;
optoutCommand.description = 'Uso: !optout <lastseen/stalk/remind>; Resposta esperada: A partir de agora você {optou/não optou} por {lastseen/stalk/remind}';
optoutCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/${optoutCommand.commandName}/${optoutCommand.commandName}.js`;

module.exports = {
    optoutCommand,
};