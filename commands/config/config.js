const { processCommand } = require("../../utils/processCommand.js");

const configCommand = async (client, message) => {
    message.command = 'config';
    if (!await processCommand(5000, 'channel', message, client)) return;

    if (message.senderUsername !== process.env.DEV_NICK) {
        if (message.senderUsername !== message.channelName || !message.isMod ) {
            client.log.logAndReply(message, `Apenas moderadores podem usar este comando`);
            return;
        }
    }

    if (message.messageText.split(" ").length === 1) {
        client.log.logAndReply(message, `Use o formato: ${message.commandPrefix}config <prefixo/ban ou unban/offline>`);
        return;
    }

    const args = message.messageText.split(" ");
    const configTarget = args[1].toLowerCase();
    
    if (configTarget === 'prefixo') {
        const possiblePrefixes = ['!', '?', '&', '%', '+', '*', '-', '=', '|', '@', '#', '$', '~', '\\', '_', ',', ';', '<', '>'];
        if (args.length < 3) {
            client.log.logAndReply(message, `Use o formato: ${message.commandPrefix}config prefixo <prefixo>. Prefixos possíveis: ${possiblePrefixes.join('')}`);
            return;
        }

        if (!possiblePrefixes.includes(args[2])) {
            client.log.logAndReply(message, `Prefixo inválido. Prefixos possíveis: ${possiblePrefixes.join('')}`);
            return;
        }

        await client.db.update('config', { channelId: message.channelID }, { $set: { prefix: args[2] } });
        await client.reloadChannelConfigs();
        await client.reloadChannelPrefixes();

        client.log.logAndReply(message, `Prefixo atualizado para ${args[2]}`);
        return;
    }

    if (configTarget === 'ban') {
        if (args.length < 3) {
            client.log.logAndReply(message, `Use o formato: ${message.commandPrefix}config ban <comando>.`);
            return;
        }
        
        const commandsList = client.commandsList;
        const command = args[2].toLowerCase();
        if (!(command in commandsList)) {
            client.log.logAndReply(message, `O comando ${command} não é válido. Se estiver com dúvidas, contacte o @${process.env.DEV_NICK}`);	
            return;
        }

        const commandName = commandsList[command].aliases[0];
        await client.db.update('config', { channelId: message.channelID }, { $push: { disabledCommands: commandName } });
        await client.reloadChannelConfigs();

        client.log.logAndReply(message, `O comando ${commandName} foi desabilitado`);
        return;
    }

    if (configTarget === 'unban') {
        if (args.length < 3) {
            client.log.logAndReply(message, `Use o formato: ${message.commandPrefix}config unban <comando>.`);
            return;
        }

        const commandsList = client.commandsList;
        const command = args[2].toLowerCase();
        if (!(command in commandsList)) {
            client.log.logAndReply(message, `O comando ${command} não é válido. Se estiver com dúvidas, contacte o @${process.env.DEV_NICK}`);	
            return;
        }

        const commandName = commandsList[command].aliases[0];
        await client.db.update('config', { channelId: message.channelID }, { $pull: { disabledCommands: commandName } });
        await client.reloadChannelConfigs();

        client.log.logAndReply(message, `O comando ${commandName} foi reabilitado`);
        return;
    }

    if (['offline', 'online'].includes(configTarget)) {
        const currState = client.channelConfigs[message.channelName].offlineOnly;
        await client.db.update('config', { channelId: message.channelID }, { $set: { offlineOnly: !currState } });
        await client.reloadChannelConfigs();

        if (!currState) {
            client.log.logAndReply(message, `Eu agora só vou funcionar quando o streamer não estiver em live 👍`);
        } else {
            client.log.logAndReply(message, `Eu agora vou funcionar independentemente de o streamer estar em live ou não 👍`);
        }
        return;
    }
};

configCommand.aliases = ['config'];

module.exports = {
    configCommand,
};
