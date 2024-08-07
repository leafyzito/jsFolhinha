const { afkUserListener, reminderListener, updateUserListener } = require('./listeners.js');

function commandHandler(client, message) {
    if (message.messageText.startsWith(message.commandPrefix)) {
        const command = message.messageText.slice(message.commandPrefix.length).split(' ')[0].toLowerCase();

        const commandsList = client.commandsList;
        if (command in commandsList) {
            commandsList[command](client, message)
                .catch(err => { console.log(`Error in command ${command}: ${err}`); });
        }
    }
}

function listenerHandler(client, message) {
    afkUserListener(client, message)
        .catch(err => { console.log(`Error in afk listener: ${err}`); });

    reminderListener(client, message)
        .catch(err => { console.log(`Error in reminder listener: ${err}`); });

    updateUserListener(client, message)
        .catch(err => { console.log(`Error in update user listener: ${err}`); });
}

module.exports = { 
    commandHandler,
    listenerHandler
};
