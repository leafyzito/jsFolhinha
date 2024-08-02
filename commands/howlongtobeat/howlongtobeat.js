// let hltb = require('howlongtobeat');
const { manageCooldown } = require("../../utils/manageCooldown.js");

// let hltbService = new hltb.HowLongToBeatService();

const howLongToBeatCommand = async (client, message) => {
    message.command = 'howlongtobeat';
    if (!manageCooldown(5000, 'channel', message.senderUsername, message.command)) return;
    
    client.log.logAndReply(message, 'Não consegui refazer esse comando no folhinha 3.0 :( tentarei de novo recentemente');
}


module.exports = {
    howLongToBeatCommand,
    howLongToBeatAliases: ['howlongtobeat', 'hltb']
};