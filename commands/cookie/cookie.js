const { processCommand } = require("../../utils/processCommand.js");
const { randomInt, randomChoice } = require("../../utils/utils.js");
const fs = require('fs');

const cookieFrases = fs.readFileSync('data/cookie_frases.txt', 'utf8');

async function createUserCookieBase(client, message) { // isto é só para o cd, acho eu
    const insert_doc = {
        userId: message.senderUserID,
        user: message.senderUsername,
        total: 1,
        gifted: 0,
        beenGifted: 0,
        opened: 0,
        sloted: 0,
        claimedToday: true,
        giftedToday: false,
        usedSlot: false,
    };
    await client.db.insert('cookie', insert_doc);
    return insert_doc;
};

async function loadUserCookieStats(client, targetId) {
    const findFilter = { userId: targetId };
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
        client.log.logAndReply(message, `Está com dúvidas sobre os comandos de cookie? Acesse https://folhinhabot.com/comandos/cookie 😁`);
        return;
    }

    const args = message.messageText.split(' ');
    const targetCommand = args[1].toLowerCase();

    if (['diario', 'diário', 'daily'].includes(targetCommand)) {
        const userCookieStats = await loadUserCookieStats(client, message.senderUserID);

        if (!userCookieStats) {
            await createUserCookieBase(client, message);
            client.log.logAndReply(message, `Você resgatou seu cookie diário e agora tem 1 cookie! 🍪`);
            return;
        }

        if (userCookieStats.claimedToday) {
            // Calculate the time remaining until the next 9 AM
            const now = new Date();
            let nextNineAM = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0);

            // If it's already past 9 AM today, calculate time until 9 AM tomorrow
            if (now >= nextNineAM) {
                nextNineAM.setDate(nextNineAM.getDate() + 1);
            }

            const timeLeft = nextNineAM - now;
            const hours = Math.floor(timeLeft / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

            client.log.logAndReply(message, `Você já resgatou o seu cookie diário hoje. Volte em ${hours}h ${minutes}m para resgatar o seu cookie diário novamente ⌛`);
            return;
        }

        userCookieStats.total += 1;
        userCookieStats.claimedToday = true;
        await client.db.update('cookie', { userId: message.senderUserID }, { $set: { total: userCookieStats.total, claimedToday: userCookieStats.claimedToday } });
        client.log.logAndReply(message, `Você resgatou seu cookie diário e agora tem ${userCookieStats.total} cookies! 🍪`);
        return;
    }

    if (['abrir', 'open'].includes(targetCommand)) {
        const userCookieStats = await loadUserCookieStats(client, message.senderUserID);

        if (!userCookieStats || userCookieStats.total <= 0) {
            client.log.logAndReply(message, `Você não tem cookies para abrir. Use ${message.commandPrefix}cd para resgatar o cookie diário`);
            return;
        }

        userCookieStats.total -= 1;
        userCookieStats.opened += 1;
        await client.db.update('cookie', { userId: message.senderUserID }, { $set: { total: userCookieStats.total, opened: userCookieStats.opened } });
        const randomFrase = randomChoice(cookieFrases.split('\n')).replace(/[\n\r]/g, ' ');
        client.log.logAndReply(message, `${randomFrase} 🥠`)
        return;
    }

    if (['oferecer', 'gift', 'give', 'oferta', 'offer'].includes(targetCommand)) {
        const userCookieStats = await loadUserCookieStats(client, message.senderUserID);
        if (!userCookieStats) {
            client.log.logAndReply(message, `Você não tem cookies para oferecer. Use ${message.commandPrefix}cd para resgatar o seu cookie diário`);
            return;
        }
        if (userCookieStats.total <= 0) {
            client.log.logAndReply(message, `Você não tem cookies para oferecer. Use ${message.commandPrefix}cd para resgatar o seu cookie diário`);
            return;
        }

        if (userCookieStats.giftedToday) {
            client.log.logAndReply(message, `Você já ofereceu um cookie hoje. Agora só pode oferecer novamente amanhã ⌛`);
            return;
        }

        const targetUser = message.messageText.split(' ')[2]?.replace(/^@/, '');
        if (!targetUser) {
            client.log.logAndReply(message, `Use o formato: ${message.commandPrefix}cookie gift <usuário>`);
            return;
        }

        if (targetUser.toLowerCase() === message.senderUsername.toLowerCase()) {
            client.log.logAndReply(message, `Você não pode oferecer cookies para si mesmo Stare`);
            return;
        }

        const targetUserID = await client.getUserID(targetUser);
        if (!targetUserID) {
            client.log.logAndReply(message, `Esse usuário não existe`);
            return;
        }

        const targetUserCookieStats = await loadUserCookieStats(client, targetUserID);
        if (!targetUserCookieStats) {
            client.log.logAndReply(message, `${targetUser} ainda não foi registrado (nunca usou ${message.commandPrefix}cd)`);
            return;
        }

        targetUserCookieStats.beenGifted += 1;
        userCookieStats.total -= 1;
        userCookieStats.gifted += 1;
        await client.db.update('cookie', { userId: message.senderUserID }, { $set: { total: userCookieStats.total, gifted: userCookieStats.gifted, giftedToday: true } });
        await client.db.update('cookie', { userId: targetUserID }, { $set: { beenGifted: targetUserCookieStats.beenGifted, total: targetUserCookieStats.total + 1 } });
        const emote = await client.emotes.getEmoteFromList(message.channelName, ['peepoCookie'], '🎁🍪')
        client.log.logAndReply(message, `Você ofereceu um cookie para ${targetUser} ${emote}`);
        return;
    }

    if (['stats', 'mostrar', 'show'].includes(targetCommand)) {
        const targetUser = message.messageText.split(' ')[2] ? message.messageText.split(' ')[2].replace(/^@/, '') : message.senderUsername;
        const targetUserID = (targetUser !== message.senderUsername) ? await client.getUserID(targetUser) : message.senderUserID;
        if (!targetUserID) {
            client.log.logAndReply(message, `Esse usuário não existe`);
            return;
        }

        const userCookieStats = await loadUserCookieStats(client, targetUserID);
        if (!userCookieStats) {
            client.log.logAndReply(message, `${targetUser} ainda não foi registrado (nunca usou ${message.commandPrefix}cd)`);
            return;
        }

        const total = userCookieStats.total;
        const opened = userCookieStats.opened;
        const gifted = userCookieStats.gifted;
        const beenGifted = userCookieStats.beenGifted;
        const sloted = userCookieStats.sloted;
        client.log.logAndReply(message, `${targetUser} tem ${total} cookies, 🥠 abriu ${opened}, 🎁 ofereceu ${gifted}, 🎁 foi presenteado com ${beenGifted} e 🎰 apostou ${sloted}`);
        return;
    }

    if (['top', 'ranking', 'rank', 'leaderboard', 'lb'].includes(targetCommand)) {

        if (['gift', 'gifts', 'oferta', 'gifted'].includes(args[2])) {
            const topUsers = await client.db.get('cookie', { userId: { "$ne": "925782584" } });
            topUsers.sort((a, b) => b.gifted - a.gifted);

            // only top 5
            const top5 = topUsers.slice(0, 5);
            let reply = `Top 5 mais cookies oferecidos: `;
            for (let i = 0; i < top5.length; i++) {
                const user = top5[i];
                const username = await client.getUserByUserID(user.userId);
                reply += `${i + 1}º ${username}: (${user.gifted})`;
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
                reply += `. Você está em ${topUsers.findIndex(user => user.userId === message.senderUserID) + 1}º com ${topUsers.find(user => user.userId === message.senderUserID).gifted} cookies oferecidos`;
            }

            client.log.logAndReply(message, `${reply} 🎁`);
            return;
        }

        if (['aposta', 'apostas', 'slot', 'slots'].includes(args[2])) {
            const topUsers = await client.db.get('cookie', { userId: { "$ne": "925782584" } });
            topUsers.sort((a, b) => b.sloted - a.sloted);

            // only top 5
            const top5 = topUsers.slice(0, 5);
            let reply = `Top 5 cookies apostados: `;
            for (let i = 0; i < top5.length; i++) {
                const user = top5[i];
                const username = await client.getUserByUserID(user.userId);
                reply += `${i + 1}º ${username}: (${user.sloted})`;
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
                reply += `. Você está em ${topUsers.findIndex(user => user.userId === message.senderUserID) + 1}º com ${topUsers.find(user => user.userId === message.senderUserID).sloted} cookies apostados`;
            }

            client.log.logAndReply(message, `${reply} 🍪`);
            return;
        }

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
        const userCookieStats = await loadUserCookieStats(client, message.senderUserID);
        if (!userCookieStats || userCookieStats.total <= 0) {
            client.log.logAndReply(message, `Você não tem cookies para apostar. Use ${message.commandPrefix}cd para resgatar o seu cookie diário`);
            return;
        }

        if (userCookieStats.usedSlot) {
            client.log.logAndReply(message, `Você já apostou hoje. Agora só pode apostar novamente amanhã ⌛`);
            return;
        }

        // Current chances: https://f.feridinha.com/Hk1Am.png
        // TODO: add joker card 🃏 with 1% chance of appearing
        // - if 2 jokers, add 5% of current jackpot to jackpot
        // - if 3 jokers, give 5% of current jackpot to user
        const getSlotSymbol = () => {
            // 1% chance for joker, 99% chance for regular symbols
            const isJoker = Math.random() < 0.01;
            if (isJoker) {
                return '🃏';
            }
            return randomChoice(['🍒', '🍊', '🍋', '🍇', '🍉', '🍓']);
        };
        const slotResults2 = [getSlotSymbol(), getSlotSymbol(), getSlotSymbol()];

        const currentJackpot = await client.db.get('cookie', { userId: process.env.BOT_USERID });

        const slotResults = [randomChoice(['🍒', '🍊', '🍋', '🍇', '🍉', '🍓']), randomChoice(['🍒', '🍊', '🍋', '🍇', '🍉', '🍓']), randomChoice(['🍒', '🍊', '🍋', '🍇', '🍉', '🍓'])];
        let reply = `[${slotResults[0]}${slotResults[1]}${slotResults[2]}] `;

        if (slotResults[0] === slotResults[1] && slotResults[0] === slotResults[2]) {
            const emote = await client.emotes.getEmoteFromList(message.channelName, client.emotes.pogEmotes, 'PogChamp');
            reply += `você apostou 1 cookie e ganhou 100 cookies! ${emote}`;
            userCookieStats.total += 9;
            userCookieStats.sloted += 1;
            userCookieStats.usedSlot = true;
            await client.db.update('cookie', { userId: message.senderUserID }, { $set: { total: userCookieStats.total, sloted: userCookieStats.sloted, usedSlot: userCookieStats.usedSlot } });

        } else if (slotResults[0] === slotResults[1] || slotResults[0] === slotResults[2] || slotResults[1] === slotResults[2]) {
            reply += `você apostou 1 cookie e ganhou 30 cookies!`;
            userCookieStats.total += 2;
            userCookieStats.sloted += 1;
            userCookieStats.usedSlot = true;
            await client.db.update('cookie', { userId: message.senderUserID }, { $set: { total: userCookieStats.total, sloted: userCookieStats.sloted, usedSlot: userCookieStats.usedSlot } });
        } else {
            const emote = await client.emotes.getEmoteFromList(message.channelName, client.emotes.sadEmotes, ':(');
            reply += `você apostou 1 cookie e ficou sem ele... (adicionado ao jackpot ⇒ ${currentJackpot[0].total + 1}) ${emote}`;
            userCookieStats.total -= 1;
            userCookieStats.sloted += 1;
            userCookieStats.usedSlot = true;
            await client.db.update('cookie', { userId: message.senderUserID }, { $set: { total: userCookieStats.total, sloted: userCookieStats.sloted, usedSlot: userCookieStats.usedSlot } });

            // increase jackpot by adding 1 cookie to folhinhabot
            await client.db.update('cookie', { userId: process.env.BOT_USERID }, { $inc: { total: 1 } });
        }

        client.log.logAndReply(message, reply);
        return;
    }

    client.log.logAndReply(message, `Está com dúvidas sobre os comandos de cookie? Acesse https://folhinhabot.com/comandos/cookie 😁`);
    return;
};


const cookieDiarioCommand = async (client, message) => {
    message.command = 'cd';
    if (!await processCommand(5000, 'user', message, client)) return;

    const userCookieStats = await loadUserCookieStats(client, message.senderUserID);
    if (!userCookieStats) {
        await createUserCookieBase(client, message);
        client.log.logAndReply(message, `Você resgatou seu cookie diário e agora tem 1 cookie! 🍪`);
        return;
    }

    if (userCookieStats.claimedToday) {
        // Calculate the time remaining until the next 9 AM
        const now = new Date();
        let nextNineAM = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0);

        // If it's already past 9 AM today, calculate time until 9 AM tomorrow
        if (now >= nextNineAM) {
            nextNineAM.setDate(nextNineAM.getDate() + 1);
        }

        const timeLeft = nextNineAM - now;
        const hours = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

        client.log.logAndReply(message, `Você já resgatou o seu cookie diário hoje. Volte em ${hours}h ${minutes}m para resgatar o seu cookie diário novamente ⌛`);
        return;
    }

    userCookieStats.total += 1;
    userCookieStats.claimedToday = true;
    await client.db.update('cookie', { userId: message.senderUserID }, { $set: { total: userCookieStats.total, claimedToday: userCookieStats.claimedToday } });
    client.log.logAndReply(message, `Você resgatou seu cookie diário e agora tem ${userCookieStats.total}00 cookies! 🍪`);
    return;
};

cookieCommand.commandName = 'cookie';
cookieCommand.aliases = ['cookie', 'cookies'];
cookieCommand.shortDescription = 'Faça várias coisas relacionadas com os cookies';
cookieCommand.cooldown = 5000;
cookieCommand.whisperable = true;
cookieCommand.description = `!Cookie diario/daily: Receba um cookie. O comando poderá ser reutilizado todo dia a partir das cinco horas da manhã (horário de Brasília). Há de aliase o comando "cd" de mesma funcionalidade.

!Cookie open: Abra um dos seus cookies para receber uma poderosa mensagem de reflexão.

!Cookie gift/give: Ofereça um dos seus cookies a outro usuario, uma vez presenteado, poderá presentear novamente no próximo ciclo do cookie diário.

!Cookie slot: Aposte um dos seus cookies e tenha a chance de ganhar 3 ou 10 cookies. Poderá apostar novamente no próximo ciclo do cookie diário.

!Cookie show: Exibe estatísticas de cookies. Quando não mencionado um usuário, exibirá as estatísticas de quem realizou o comando.

!Cookie top: Exiba os cinco usuários com mais cookies e a sua posição no ranking global. Use "!cookie top gift" e "!cookie top slot" para exibir os maiores presenteadores e apostadores, respectivamente, e a sua posição no ranking específico.`;
cookieCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/${cookieCommand.commandName}/${cookieCommand.commandName}.js`;

cookieDiarioCommand.commandName = 'cookie diário (cd)';
cookieDiarioCommand.aliases = ['cd'];
cookieDiarioCommand.shortDescription = 'Resgate o seu cookie diário';
cookieDiarioCommand.cooldown = 5000;
cookieDiarioCommand.whisperable = true;
cookieDiarioCommand.description = 'Uso: !cd; Resposta esperada: Você resgatou seu cookie diário e agora tem {cookies}';
cookieDiarioCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/${cookieCommand.commandName}/${cookieCommand.commandName}.js`;

module.exports = {
    cookieCommand,
    cookieDiarioCommand,
};
