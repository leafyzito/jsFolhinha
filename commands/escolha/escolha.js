const { manageCooldown } = require("../../utils/manageCooldown.js");
const { randomChoice } = require("../../utils/utils.js");

const escolhaCommand = async (client, message) => {
    message.command = 'escolha';
    if (!manageCooldown(5000, 'channel', message.senderUsername, message.command)) return;

    const args = message.messageText.split(' ').splice(1);

    // remove all 'ou' and 'or' from the list of options
    args.forEach((arg, index) => {
        if (arg.toLowerCase() === 'ou' || arg.toLowerCase() === 'or') {
            args.splice(index, 1);
        }
    });

    if (args.length < 2) {
        client.log.logAndReply(message, `Intruduza pelo menos 2 elementos pra serem escolhidos`);
        return;
    }

    const choice = randomChoice(args.splice(0, args.length));
    client.log.logAndReply(message, `Eu escolho ${choice}`);
};


module.exports = {
    escolhaCommand: escolhaCommand,
    escolhaAliases: ['escolha', 'escolher', 'choose', 'choice', 'pick']
};
