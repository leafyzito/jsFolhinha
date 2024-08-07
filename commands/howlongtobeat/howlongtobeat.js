// let hltb = require('howlongtobeat');
const { processCommand } = require("../../utils/processCommand.js");

// let hltbService = new hltb.HowLongToBeatService();

const howLongToBeatCommand = async (client, message) => {
    message.command = 'howlongtobeat';
    if (!await processCommand(30_000, 'channel', message, client)) return; // trocar cooldown de volta, caso consiga fazer funcionar
    
    client.log.logAndReply(message, 'Não consegui refazer esse comando no Folhinha 3.0 :( tentarei de novo recentemente');
    return;
}

howLongToBeatCommand.aliases = ['howlongtobeat', 'hltb'];

module.exports = {
    howLongToBeatCommand,
};