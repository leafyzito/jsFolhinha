const { manageCooldown } = require("../../utils/cooldownManager.js");
const { logAndReply } = require("../../utils/log.js");
const { randomInt, randomChoice } = require("../../utils/utils.js");
const fs = require('fs');

const cookieFrases = fs.readFileSync('data/cookie_frases.txt', 'utf8');

const cookieCommand = async (client, message) => {
    message.command = 'cookie';
    if (!manageCooldown(5000, 'channel', message.senderUsername, message.command)) return;

    const randomCookie = randomChoice(cookieFrases.split('\n'));
    logAndReply(client, message, `testing: ${randomCookie}`);

};


module.exports = { cookieCommand: cookieCommand};
