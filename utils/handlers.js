// const { commandsList } = require('../commands/commandsList');

function commandHandler(client, message) {
    if (message.messageText.startsWith(message.commandPrefix)) {
        const command = message.messageText.slice(message.commandPrefix.length).split(' ')[0].toLowerCase();

        const commandsList = client.commandsList;
        if (command in commandsList) {
            commandsList[command](client, message)
            .catch(err => {
                console.log(`Error in command ${command}: ${err}`);
            });
        }
    }
}

module.exports = { commandHandler };
