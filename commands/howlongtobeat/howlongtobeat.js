// let hltb = require('howlongtobeat');
const { processCommand } = require("../../utils/processCommand.js");

// let hltbService = new hltb.HowLongToBeatService();

const howLongToBeatCommand = async (client, message) => {
    message.command = 'howlongtobeat';
    if (!await processCommand(5000, 'channel', message, client)) return;
    
    client.log.logAndReply(message, 'Não consegui refazer esse comando no folhinha 3.0 :( tentarei de novo recentemente');
}


module.exports = {
    howLongToBeatCommand,
    howLongToBeatAliases: ['howlongtobeat', 'hltb']
};