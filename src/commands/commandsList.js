const fs = require('fs');
const path = require('path');

var commandsList = {};

// Function to reload commands
const loadCommands = () => {
    // Clear existing commandsList
    Object.keys(commandsList).forEach((key) => delete commandsList[key]);

    const commandsMainDir = path.join(__dirname, '.');
    const commandDirs = fs.readdirSync(commandsMainDir);

    for (const command of commandDirs) {
        // Skil files, only process folders
        if (command.includes('.js')) { continue; }

        const commandPath = path.join(commandsMainDir, command);
        const fileModule = require(path.join(commandPath, `${command}.js`));

        // For each fileModule that have multiple commands, add them to commandsList 
        for (const commandName in fileModule) {
            if (commandName.includes('Command')) {
                // For each alias, add them to commandsList
                if (fileModule[commandName].aliases) {
                    for (const alias of fileModule[commandName].aliases) {
                        console.log(`* Loading ${commandName} - ${alias}`);
                        commandsList[alias] = fileModule[commandName];
                    }
                }
            }
        }
    }


    return commandsList;
};


// Export the loadCommands function
module.exports = {
    commandsList,
    loadCommands,
};