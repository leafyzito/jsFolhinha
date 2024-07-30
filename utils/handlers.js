const { commandsList } = require('../commands/commandsList');

function commandHandler(client, message) {
    if (message.messageText.startsWith(message.commandPrefix)) {
        const command = message.messageText.slice(message.commandPrefix.length).split(' ')[0].toLowerCase();
        if (command in commandsList) {
            // commandsList[command](target, tags, message, client);
            commandsList[command](client, message);
        }
    }
}

module.exports = { commandHandler };
