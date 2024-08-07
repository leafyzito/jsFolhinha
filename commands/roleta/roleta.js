const { parse } = require("dotenv");
const { processCommand } = require("../../utils/processCommand.js");
const { randomInt } = require("../../utils/utils.js");

const roletaCommand = async (client, message) => {
    message.command = 'roleta';
    // if (!await processCommand(5000, 'channel', message, client)) return;

    if (message.senderUsername === message.channelName) {
        client.log.logAndReply(message, `Eu não consigo te explodir, mas você consegue monkaS`);
        return;
    }

    if (message.isMod) {
        client.log.logAndReply(message, `Infelizmente não consigo te explodir 😡`);
        return;
    }

    var timeoutDuration = message.messageText.split(' ')[1] || 10;
    timeoutDuration = parseInt(timeoutDuration) * 60;

    const randomChance = 1; // randomInt(1, 6);
    if (randomChance !== 1) {
        client.log.logAndReply(message, `Click! Não foi dessa vez monkaS`);
        return;
    }
    
    const timeout = await client.timeoutUser(message, timeoutDuration, 'foi de roleta russa');

    if (!timeout) {
        client.log.logAndReply(message, `Eu não tenho mod, não vai não :(`);
        return;
    }

    client.log.logAndSay(message, `BANG! Foi de arrasta pra cima :tf:`);
};

roletaCommand.aliases = ['roleta', 'rr'];

module.exports = {
    roletaCommand,
};
