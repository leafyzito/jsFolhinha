const { processCommand } = require("../../utils/processCommand.js");
const { randomChoice, capitalize } = require("../../utils/utils.js");

const charadasData = require('./charadas.json');

async function waitForMessage(client, check, timeout = 30_000) {
    return new Promise((resolve) => {
        const timer = setTimeout(() => {
            resolve(null);
        }, timeout);

        client.on('PRIVMSG', (msg) => {
            if (msg.channelName === check.channelName
                && check.content.some(content => msg.messageText.toLowerCase().trim() === content.toLowerCase().trim())) {
                clearTimeout(timer);
                resolve(msg);
            }
        });
    });
}

// async function createUserCookieBase(client, message) {
//     const insert_doc = {
//         userId: message.senderUserID,
//         user: message.senderUsername,
//         total: 0,
//         gifted: 0,
//         beenGifted: 0,
//         opened: 0,
//         sloted: 0,
//         claimedToday: true,
//         giftedToday: false,
//         usedSlot: false,
//     };
//     await client.db.insert('cookie', insert_doc);
//     return insert_doc;
// };

// async function loadUserCookieStats(client, message) {
//     const findFilter = { userId: message.senderUserID };
//     const userCookieStats = await client.db.get('cookie', findFilter);
//     if (userCookieStats.length === 0) {
//         const newUserCookieStats = await createUserCookieBase(client, message);
//         return newUserCookieStats;
//     }
//     return userCookieStats[0];
// };

const charadaCommand = async (client, message, anonClient) => {
    message.command = 'charada';
    if (!await processCommand(30_000, 'channel', message, client)) return;

    const charada = randomChoice(Object.values(charadasData));
    console.log(charada);

    await client.log.reply(message, `${message.senderUsername} iniciou uma charada! ${capitalize(charada.pergunta)}`);

    const check = {
        channelName: message.channelName,
        content: charada.resposta
    };
    const responseMsg = await waitForMessage(anonClient, check);
    if (!responseMsg) {
        const emote = await client.emotes.getEmoteFromList(message.channelName, client.emotes.sadEmotes, ':('); 
        client.log.logAndReply(message, `Ninguém respondeu a charada a tempo! ${emote} A resposta era: ${charada.resposta}`);
        return;
    }

    // // give 1 cookie to user who answered - melhor não, mas fica aqui
    // const userCookieStats = await loadUserCookieStats(client, responseMsg);
    // await client.db.update('cookie', { userId: responseMsg.senderUserID }, { $inc: { total: 1 } });

    const emote = await client.emotes.getEmoteFromList(message.channelName, ['nerd', 'nerdge', 'catnerd', 'dognerd', 'giganerd'], '🤓');
    client.log.logAndReply(message, `${responseMsg.senderUsername} acertou a resposta! ${emote}`);
    return;
};

charadaCommand.commandName = 'charada';
charadaCommand.aliases = ['charada', 'charadas'];
charadaCommand.shortDescription = 'Inicie uma charada que todos podem responder';
charadaCommand.cooldown = 30_000;
charadaCommand.whisperable = false;
charadaCommand.description = `Inicie uma charada que todos do chat no qual o comando foi executado podem responder dentro de 30 segundos com a recompensa de 1 cookie para quem acertar`;
charadaCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/${charadaCommand.commandName}/${charadaCommand.commandName}.js`;

module.exports = {
    charadaCommand,
};
