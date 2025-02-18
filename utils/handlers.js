const { replyMentionListener, afkUserListener, reminderListener, updateUserListener, notifyDevMentionListener } = require('./listeners.js');
const { send7tvPresence } = require('./utils.js');

function commandHandler(client, message, anonClient) {
    if (message.messageText.startsWith(message.commandPrefix)) {
        // Remove zero-width characters from message text - needed because twitch adds random zero-width characters to dupplicated messages
        message.messageText = message.messageText.replace(/\u200B|\u200C|\u200D|\u200E|\u200F|\u{E0000}/gu, '');
        message.messageText = message.messageText.trim();

        const command = message.messageText.slice(message.commandPrefix.length).split(' ')[0].toLowerCase();

        const commandsList = client.commandsList;
        if (command in commandsList) {
            if (message.channelName != 'whisper' || (message.channelName == 'whisper' && commandsList[command].whisperable)) {
                commandsList[command](client, message, anonClient)
                    .catch(err => {
                        console.log(`Error in command in #${message.channelName}/${message.senderUsername} - ${command}: ${err}`);
                        client.discord.logError(`Error in command #${message.channelName}/${message.senderUsername} - ${command}: ${err}`);
                        client.log.logAndReply(message, `⚠️ Ocorreu um erro ao executar o comando, tente novamente`);
                    });
            } else if (message.channelName == 'whisper' && !commandsList[command].whisperable) {
                message.command = commandsList[command].aliases[0];
                client.log.logAndReply(message, `⚠️ Este comando não pode ser usado em whispers`);
            }

            // send 7tv presence
            send7tvPresence(message, process.env.BOT_7TV_UID);
        }
    }
}

function listenerHandler(client, message) {
    if ([...client.knownUserAliases].length === 0) { return console.log('still loading users'); }

    client.turso.logMessage(message);

    notifyDevMentionListener(client, message)
        .catch(err => {
            console.log(`Error in notify dev mention listener: ${err}`);
            client.discord.log(`* Error in notify dev mention listener: ${err}`);
        });

    if (message.senderUsername == 'folhinhabot') { return; }

    replyMentionListener(client, message)
        .catch(err => {
            console.log(`Error in reply mention listener: ${err}`);
            client.discord.log(`* Error in reply mention listener: ${err}`);
        });

    afkUserListener(client, message)
        .catch(err => {
            console.log(`Error in afk listener: ${err}`);
            client.discord.log(`* Error in afk listener: ${err}`);
        });

    reminderListener(client, message)
        .catch(err => {
            console.log(`Error in reminder listener: ${err}`);
            client.discord.log(`* Error in reminder listener: ${err}`);
        });

    updateUserListener(client, message)
        .catch(err => {
            console.log(`Error in update user listener: ${err}`);
            client.discord.log(`* Error in update user listener: ${err}`);
        });

}

module.exports = {
    commandHandler,
    listenerHandler
};
