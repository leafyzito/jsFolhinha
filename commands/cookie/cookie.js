const { processCommand } = require("../../utils/processCommand.js");
const { randomInt, randomChoice } = require("../../utils/utils.js");
const fs = require('fs');

const cookieFrases = fs.readFileSync('data/cookie_frases.txt', 'utf8');

async function createUserCookieBase(message) { // isto é só para o cd, acho eu
    const insert_doc = {
        userId: message.senderUserID,
        user: message.senderUsername,
        total: 0,
        gifted: 0,
        beenGifted: 0,
        opened: 0,
        sloted: 0,
        claimedToday: false,
        giftedToday: false,
        usedSlot: false,
    };
    await client.db.insert('cookie', insert_doc);
    return insert_doc;
};

async function loadUserCookieStats(message) {
    const findFilter = { userId: message.senderUserID };
    const userCookieStats = await client.db.get('cookie', findFilter);
    if (userCookieStats.length === 0) {
        return null;
    }
    return userCookieStats[0];
};


const cookieCommand = async (client, message) => {
    message.command = 'cookie';
    if (!await processCommand(5000, 'user', message, client)) return;

    if (message.messageText.split(' ').length < 2) {
        client.log.logAndReply(message, `Está com dúvidas sobre os comandos de cookie? Acesse https://folhinhabot.github.io/comandos 😁`);
        return;
    }

    const targetCommand = message.messageText.split(' ')[1].toLowerCase();

    if (['abrir', 'open'].includes(targetCommand)) {
        const userCookieStats = await loadUserCookieStats(message);

        if (!userCookieStats || userCookieStats.total <= 0) {
            client.log.logAndReply(message, `Você não tem cookies para abrir. Use ${message.commandPrefix}cd para resgatar o cookie diário`);
            return;
        }

        userCookieStats.total -= 1;
        userCookieStats.opened += 1;
        await client.db.update('cookie', { userId: message.senderUserID }, { $set: { total: userCookieStats.total, opened: userCookieStats.opened } });
        client.log.logAndReply(message, `${randomChoice(cookieFrases.split('\n'))} 🥠`)
        return;
    }

    if (['oferecer', 'gift', 'give', 'oferta', 'offer'].includes(targetCommand)) {
        const userCookieStats = await loadUserCookieStats(message);
        if (userCookieStats.total <= 0) {
            client.log.logAndReply(message, `Você não tem cookies para oferecer. Use ${message.commandPrefix}cd para resgatar o seu cookie diário`);
            return;
        }

        if (userCookieStats.giftedToday) {
            client.log.logAndReply(message, `Você já ofereceu um cookie hoje. Agora só pode oferecer de novo amanhã ⌛`);
            return;
        }

        const targetUser = message.messageText.split(' ')[2].replace(/^@/, '')
        if (!targetUser) {
            client.log.logAndReply(message, `Use o formato: ${message.commandPrefix}cookie gift <usuário>`);
            return;
        }

        if (targetUser === message.senderUsername) {
            client.log.logAndReply(message, `Você não pode oferecer cookies para si mesmo Stare`);
            return;
        }

        const targetUserID = await client.getUserID(targetUser);
        if (!targetUserID) {
            client.log.logAndReply(message, `Esse usuário não existe`);
            return;
        }

        const targetUserCookieStats = await loadUserCookieStats({ senderUserID: targetUserID });
        if (!targetUserCookieStats) {
            client.log.logAndReply(message, `${targetUser} ainda não foi registrado (nunca usou ${message.commandPrefix}cd)`);
            return;
        }

        targetUserCookieStats.beenGifted += 1;
        userCookieStats.total -= 1;
        userCookieStats.gifted += 1;
        await client.db.update('cookie', { userId: message.senderUserID }, { $set: { total: userCookieStats.total, gifted: userCookieStats.gifted } });
        await client.db.update('cookie', { userId: targetUserID }, { $set: { beenGifted: targetUserCookieStats.beenGifted, total: targetUserCookieStats.total + 1 } });
        client.log.logAndReply(message, `Você ofereceu um cookie para ${targetUser} 🍪`);
        return;
    }

    if (['stats', 'mostrar', 'show'].includes(targetCommand)) {
        const targetUser = message.messageText.split(' ')[2] ? message.messageText.split(' ')[2].replace(/^@/, '') : message.senderUsername;
        const targetUserID = (targetUser !== message.senderUsername) ? await client.getUserID(targetUser) : message.senderUserID;
        if (!targetUserID) {
            client.log.logAndReply(message, `Esse usuário não existe`);
            return;
        }

        const userCookieStats = await loadUserCookieStats({ senderUserID: targetUserID });
        if (!userCookieStats) {
            client.log.logAndReply(message, `${targetUser} ainda não foi registrado (nunca usou ${message.commandPrefix}cd)`);
            return;
        }

        const total = userCookieStats.total;
        const opened = userCookieStats.opened;
        const gifted = userCookieStats.gifted;
        const beenGifted = userCookieStats.beenGifted;
        const sloted = userCookieStats.sloted;
        client.log.logAndReply(message, `${targetUser} tem ${total} cookies, 🥠 abriu ${opened}, 🎁 ofereceu ${gifted}, 🎁 foi presentiado com ${beenGifted} e 🎰 apostou ${sloted}`);
        return;
    }

    if (['top', 'ranking', 'rank', 'leaderboard', 'lb'].includes(targetCommand)) {
        const topUsers = await client.db.get('cookie', { userId: { "$ne": "925782584" } });
        topUsers.sort((a, b) => b.total - a.total);

        // only top 5
        const top5 = topUsers.slice(0, 5);
        let reply = `Top 5 quantidade de cookies: `;
        for (let i = 0; i < top5.length; i++) {
            const user = top5[i];
            const username = await client.getUserByUserID(user.userId);
            reply += `${i + 1}º ${username}: (${user.total})`;
            if (i !== top5.length - 1) {
                reply += ', ';
            }
        }

        let userPlacing;
        for (let i = 0; i < top5.length; i++) {
            if (top5[i].userId === message.senderUserID) {
                userPlacing = i + 1;
                break;
            }
        }

        if (!userPlacing) {
            reply += `. Você está em ${topUsers.findIndex(user => user.userId === message.senderUserID) + 1}º com ${topUsers.find(user => user.userId === message.senderUserID).total} cookies`;
        }

        client.log.logAndReply(message, `${reply} 🍪`);
        return;
    }

    if (['apostar', 'slot', 'slotmachine'].includes(targetCommand)) {
        const userCookieStats = await loadUserCookieStats(message);
        if (!userCookieStats || userCookieStats.total <= 0) {
            client.log.logAndReply(message, `Você não tem cookies para apostar. Use ${message.commandPrefix}cd para resgatar o seu cookie diário`);
            return;
        }

        if (userCookieStats.usedSlot) {
            client.log.logAndReply(message, `Você já apostou hoje. Agora só pode apostar de novo amanhã ⌛`);
            return;
        }

        const slotResults = [randomChoice(['🍒', '🍊', '🍋', '🍇', '🍉', '🍓']), randomChoice(['🍒', '🍊', '🍋', '🍇', '🍉', '🍓']), randomChoice(['🍒', '🍊', '🍋', '🍇', '🍉', '🍓'])];
        let reply = `[${slotResults[0]}${slotResults[1]}${slotResults[2]}] `;

        if (slotResults[0] === slotResults[1] && slotResults[0] === slotResults[2]) {
            reply += `você apostou 1 cookie e ganhou 10 cookies! PogChamp`;
            userCookieStats.total += 9;
            userCookieStats.sloted += 1;
            userCookieStats.usedSlot = true;
            await client.db.update('cookie', { userId: message.senderUserID }, { $set: { total: userCookieStats.total, sloted: userCookieStats.sloted, usedSlot: userCookieStats.usedSlot } });

        } else if (slotResults[0] === slotResults[1] || slotResults[0] === slotResults[2] || slotResults[1] === slotResults[2]) {
            reply += `você apostou 1 cookie e ganhou 3 cookies!`;
            userCookieStats.total += 2;
            userCookieStats.sloted += 1;
            userCookieStats.usedSlot = true;
            await client.db.update('cookie', { userId: message.senderUserID }, { $set: { total: userCookieStats.total, sloted: userCookieStats.sloted, usedSlot: userCookieStats.usedSlot } });
        } else {
            reply += `você apostou 1 cookie e ficou sem ele...`;
            userCookieStats.total -= 1;
            userCookieStats.sloted += 1;
            userCookieStats.usedSlot = true;
            await client.db.update('cookie', { userId: message.senderUserID }, { $set: { total: userCookieStats.total, sloted: userCookieStats.sloted, usedSlot: userCookieStats.usedSlot } });

            // increase jackpot by adding 1 cookie to folhinhabot
            await client.db.update('cookie', { userId: "925782584" }, { $inc: { total: 1 } });
        }

        client.log.logAndReply(message, reply);
        return;
    }

    client.log.logAndReply(message, `Está com dúvidas sobre os comandos de cookie? Acesse https://folhinhabot.github.io/comandos 😁`);
    return;
};


const cookieDiarioCommand = async (client, message) => {
    message.command = 'cookie';
    if (!await processCommand(5000, 'user', message, client)) return;

    const userCookieStats = await loadUserCookieStats(message);
    if (!userCookieStats) {
        await createUserCookieBase(message);
        client.log.logAndReply(message, `Você resgatou seu cookie diário e agora tem 1 cookie! 🍪`);
        return;
    }

    if (userCookieStats.claimedToday) {
        // calcular tempo restante até as 9am
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 0, 0, 0);
        const timeLeft = tomorrow - now;
        const hours = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        client.log.logAndReply(message, `Você já resgatou seu cookie diário hoje. Volte em ${hours}h ${minutes}m para resgatar o seu cookie diário de novo ⌛ (possível de este timer estar errado, avisar o dev caso for o caso)`);
        return;
    }

    userCookieStats.total += 1;
    userCookieStats.claimedToday = true;
    await client.db.update('cookie', { userId: message.senderUserID }, { $set: { total: userCookieStats.total, claimedToday: userCookieStats.claimedToday } });
    client.log.logAndReply(message, `Você resgatou seu cookie diário e agora tem ${userCookieStats.total} cookies! 🍪`);
    return;
};

cookieCommand.aliases = ['cookie', 'cookies'];
cookieDiarioCommand.aliases = ['cd'];

module.exports = {
    cookieCommand,
    cookieDiarioCommand,
};
