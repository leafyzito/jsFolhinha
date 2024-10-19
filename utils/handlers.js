const { replyMentionListener, afkUserListener, reminderListener, updateUserListener } = require('./listeners.js');

function commandHandler(client, message) {
    if (message.messageText.startsWith(message.commandPrefix)) {
        const command = message.messageText.slice(message.commandPrefix.length).split(' ')[0].toLowerCase();

        const commandsList = client.commandsList;
        if (command in commandsList) {
            commandsList[command](client, message)
                .catch(err => {
                    console.log(`Error in command in #${message.channelName}/${message.senderUsername} - ${command}: ${err}`);
                    client.discord.logError(`Error in command #${message.channelName}/${message.senderUsername} - ${command}: ${err}`);
                });
        }
    }
}

function listenerHandler(client, message) {
    if ([...client.knownUserAliases].length === 0) { return console.log('still loading users'); }

    client.turso.logMessage(message);

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
