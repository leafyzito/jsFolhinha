const fs = require("fs");
const path = require("path");

function getTimeUntilNext9AM() {
  const now = new Date();
  let next9AM = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    9,
    0,
    0
  );

  // If it's already past 9 AM today, calculate time until 9 AM tomorrow
  if (now >= next9AM) {
    next9AM = new Date(next9AM.getTime() + 24 * 60 * 60 * 1000);
  }

  return fb.utils.relativeTime(next9AM, true, true);
}

const cookieFrases = fs.readFileSync(
  path.join(__dirname, "cookie_frases.txt"),
  "utf8"
);

async function createUserCookieBase(message) {
  // isto é só para o cd, acho eu
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
  await fb.db.insert("cookie", insert_doc);
  return insert_doc;
}

async function loadUserCookieStats(targetId) {
  const findFilter = { userId: targetId };
  const userCookieStats = await fb.db.get("cookie", findFilter);
  if (!userCookieStats) {
    return null;
  }
  return userCookieStats;
}

const cookieCommand = async (message) => {
  if (message.args.length < 2) {
    return {
      reply: `Está com dúvidas sobre os comandos de cookie? Acesse https://folhinhabot.com/comandos/cookie 😁`,
    };
  }

  const targetCommand = message.args[1].toLowerCase();

  // MARKER: cd
  if (["diario", "diário", "daily"].includes(targetCommand)) {
    const userCookieStats = await loadUserCookieStats(message.senderUserID);

    if (!userCookieStats) {
      await createUserCookieBase(message);
      return {
        reply: `Você resgatou seu cookie diário e agora tem 1 cookie! 🍪`,
      };
    }

    if (userCookieStats.claimedToday) {
      return {
        reply: `Você já resgatou o seu cookie diário hoje. Espere ${getTimeUntilNext9AM()} para resgatar o seu cookie diário novamente ⌛`,
      };
    }

    await fb.db.update(
      "cookie",
      { userId: message.senderUserID },
      {
        $set: {
          total: userCookieStats.total + 1,
          claimedToday: true,
        },
      }
    );
    return {
      reply: `Você resgatou seu cookie diário e agora tem ${
        userCookieStats.total + 1
      } cookies! 🍪`,
    };
  }

  // MARKER: abrir
  if (["abrir", "open"].includes(targetCommand)) {
    const userCookieStats = await loadUserCookieStats(message.senderUserID);

    if (!userCookieStats || userCookieStats.total <= 0) {
      return {
        reply: `Você não tem cookies para abrir. Use ${message.prefix}cd para resgatar o cookie diário`,
      };
    }

    await fb.db.update(
      "cookie",
      { userId: message.senderUserID },
      {
        $set: {
          total: userCookieStats.total - 1,
          opened: userCookieStats.opened + 1,
        },
      }
    );
    const randomFrase = fb.utils
      .randomChoice(cookieFrases.split("\n"))
      .replace(/[\n\r]/g, " ");
    return {
      reply: `${randomFrase} 🥠`,
    };
  }

  // MARKER: gift
  if (["oferecer", "gift", "give", "oferta", "offer"].includes(targetCommand)) {
    const userCookieStats = await loadUserCookieStats(message.senderUserID);

    if (!userCookieStats) {
      return {
        reply: `Você não tem cookies para oferecer. Use ${message.prefix}cd para resgatar o seu cookie diário`,
      };
    }
    if (userCookieStats.total <= 0) {
      return {
        reply: `Você não tem cookies para oferecer. Use ${message.prefix}cd para resgatar o seu cookie diário`,
      };
    }

    if (userCookieStats.giftedToday) {
      return {
        reply: `Você já ofereceu um cookie hoje. Espere ${getTimeUntilNext9AM()} para oferecer novamente ⌛`,
      };
    }

    const targetUser = message.args[2]?.replace(/^@/, "");
    if (!targetUser) {
      return {
        reply: `Use o formato: ${message.prefix}cookie gift <usuário>`,
      };
    }

    if (targetUser.toLowerCase() === message.senderUsername.toLowerCase()) {
      return {
        reply: `Você não pode oferecer cookies para si mesmo Stare`,
      };
    }

    const targetUserID = (await fb.api.helix.getUserByUsername(targetUser))?.id;
    if (!targetUserID) {
      return {
        reply: `Esse usuário não existe`,
      };
    }

    const targetUserCookieStats = await loadUserCookieStats(targetUserID);
    if (!targetUserCookieStats) {
      return {
        reply: `${targetUser} ainda não foi registrado (nunca usou ${message.prefix}cd)`,
      };
    }

    await fb.db.update(
      "cookie",
      { userId: message.senderUserID },
      {
        $set: {
          total: userCookieStats.total - 1,
          gifted: userCookieStats.gifted + 1,
          giftedToday: true,
        },
      }
    );
    await fb.db.update(
      "cookie",
      { userId: targetUserID },
      {
        $set: {
          beenGifted: targetUserCookieStats.beenGifted + 1,
          total: targetUserCookieStats.total + 1,
        },
      }
    );
    const emote = await fb.emotes.getEmoteFromList(
      message.channelName,
      ["peepoCookie"],
      "🎁🍪"
    );
    return {
      reply: `Você ofereceu um cookie para ${targetUser} ${emote}`,
    };
  }

  // MARKER: show
  if (["stats", "mostrar", "show"].includes(targetCommand)) {
    const targetUser = message.args[2]
      ? message.args[2].replace(/^@/, "")
      : message.senderUsername;
    const targetUserID =
      targetUser !== message.senderUsername
        ? (await fb.api.helix.getUserByUsername(targetUser))?.id
        : message.senderUserID;
    if (!targetUserID) {
      return {
        reply: `Esse usuário não existe`,
      };
    }

    const userCookieStats = await loadUserCookieStats(targetUserID);
    if (!userCookieStats) {
      return {
        reply: `${targetUser} ainda não foi registrado (nunca usou ${message.prefix}cd)`,
      };
    }

    const total = userCookieStats.total;
    const opened = userCookieStats.opened;
    const gifted = userCookieStats.gifted;
    const beenGifted = userCookieStats.beenGifted;
    const sloted = userCookieStats.sloted;
    return {
      reply: `${targetUser} tem ${total} cookies, 🥠 abriu ${opened}, 🎁 ofereceu ${gifted}, 🎁 foi presenteado com ${beenGifted} e 🎰 apostou ${sloted}`,
    };
  }

  // MARKER: top
  if (["top", "ranking", "rank", "leaderboard", "lb"].includes(targetCommand)) {
    // MARKER: top gift
    if (["gift", "gifts", "oferta", "gifted"].includes(message.args[2])) {
      const topUsers = await fb.db.get("cookie", {
        userId: { $ne: "925782584" },
      });
      topUsers.sort((a, b) => b.gifted - a.gifted);

      // only top 5
      const top5 = topUsers.slice(0, 5);
      let reply = `Top 5 mais cookies oferecidos: `;
      for (let i = 0; i < top5.length; i++) {
        const user = top5[i];
        const username = (await fb.api.helix.getUserByID(user.userId))
          ?.displayName;
        reply += `${i + 1}º ${username}: (${user.gifted})`;
        if (i !== top5.length - 1) {
          reply += ", ";
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
        reply += `. Você está em ${
          topUsers.findIndex((user) => user.userId === message.senderUserID) + 1
        }º com ${
          topUsers.find((user) => user.userId === message.senderUserID).gifted
        } cookies oferecidos`;
      }

      return {
        reply: `${reply} 🎁`,
      };
    }

    // MARKER: top slot
    if (["aposta", "apostas", "slot", "slots"].includes(message.args[2])) {
      const topUsers = await fb.db.get("cookie", {
        userId: { $ne: "925782584" },
      });
      topUsers.sort((a, b) => b.sloted - a.sloted);

      // only top 5
      const top5 = topUsers.slice(0, 5);
      let reply = `Top 5 cookies apostados: `;
      for (let i = 0; i < top5.length; i++) {
        const user = top5[i];
        const username = (await fb.api.helix.getUserByID(user.userId))
          ?.displayName;
        reply += `${i + 1}º ${username}: (${user.sloted})`;
        if (i !== top5.length - 1) {
          reply += ", ";
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
        reply += `. Você está em ${
          topUsers.findIndex((user) => user.userId === message.senderUserID) + 1
        }º com ${
          topUsers.find((user) => user.userId === message.senderUserID).sloted
        } cookies apostados`;
      }

      return {
        reply: `${reply} 🍪`,
      };
    }

    const topUsers = await fb.db.get("cookie", {
      userId: { $ne: "925782584" },
    });
    topUsers.sort((a, b) => b.total - a.total);

    // only top 5
    const top5 = topUsers.slice(0, 5);
    let reply = `Top 5 quantidade de cookies: `;
    for (let i = 0; i < top5.length; i++) {
      const user = top5[i];
      const username = (await fb.api.helix.getUserByID(user.userId))
        ?.displayName;
      reply += `${i + 1}º ${username}: (${user.total})`;
      if (i !== top5.length - 1) {
        reply += ", ";
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
      reply += `. Você está em ${
        topUsers.findIndex((user) => user.userId === message.senderUserID) + 1
      }º com ${
        topUsers.find((user) => user.userId === message.senderUserID).total
      } cookies`;
    }

    return {
      reply: `${reply} 🍪`,
    };
  }

  // MARKER: slot
  if (["apostar", "slot", "slotmachine"].includes(targetCommand)) {
    const userCookieStats = await loadUserCookieStats(message.senderUserID);
    if (!userCookieStats || userCookieStats.total <= 0) {
      return {
        reply: `Você não tem cookies para apostar. Use ${message.prefix}cd para resgatar o seu cookie diário`,
      };
    }

    if (userCookieStats.usedSlot) {
      return {
        reply: `Você já apostou hoje. Espere ${getTimeUntilNext9AM()} para apostar novamente ⌛`,
      };
    }

    // Current chances: https://f.feridinha.com/Hk1Am.png
    // TODO: add joker card 🃏 with 1% chance of appearing
    // - if 2 jokers, add 5% of current jackpot to jackpot
    // - if 3 jokers, give 5% of current jackpot to user

    // const getSlotSymbol = () => {
    //   // 1% chance for joker, 99% chance for regular symbols
    //   const isJoker = Math.random() < 0.01;
    //   if (isJoker) {
    //     return "🃏";
    //   }
    //   return fb.utils.randomChoice(["🍒", "🍊", "🍋", "🍇", "🍉", "🍓"]);
    // };
    // const slotResults2 = [getSlotSymbol(), getSlotSymbol(), getSlotSymbol()];

    // const currentJackpot = await fb.db.get("cookie", {
    //   userId: process.env.BOT_USERID,
    // });

    const slotResults = [
      fb.utils.randomChoice(["🍒", "🍊", "🍋", "🍇", "🍉", "🍓"]),
      fb.utils.randomChoice(["🍒", "🍊", "🍋", "🍇", "🍉", "🍓"]),
      fb.utils.randomChoice(["🍒", "🍊", "🍋", "🍇", "🍉", "🍓"]),
    ];
    let reply = `[${slotResults[0]}${slotResults[1]}${slotResults[2]}] `;

    if (
      slotResults[0] === slotResults[1] &&
      slotResults[0] === slotResults[2]
    ) {
      const emote = await fb.emotes.getEmoteFromList(
        message.channelName,
        fb.emotes.pogEmotes,
        "PogChamp"
      );
      reply += `você apostou 1 cookie e ganhou 10 cookies! ${emote}`;
      await fb.db.update(
        "cookie",
        { userId: message.senderUserID },
        {
          $set: {
            total: userCookieStats.total + 9,
            sloted: userCookieStats.sloted + 1,
            usedSlot: true,
          },
        }
      );
    } else if (
      slotResults[0] === slotResults[1] ||
      slotResults[0] === slotResults[2] ||
      slotResults[1] === slotResults[2]
    ) {
      reply += `você apostou 1 cookie e ganhou 3 cookies!`;
      await fb.db.update(
        "cookie",
        { userId: message.senderUserID },
        {
          $set: {
            total: userCookieStats.total + 2,
            sloted: userCookieStats.sloted + 1,
            usedSlot: true,
          },
        }
      );
    } else {
      const emote = await fb.emotes.getEmoteFromList(
        message.channelName,
        fb.emotes.sadEmotes,
        ":("
      );
      // reply += `você apostou 1 cookie e ficou sem ele... (adicionado ao jackpot ⇒ ${currentJackpot[0].total + 1}) ${emote}`;
      reply += `você apostou 1 cookie e ficou sem ele... ${emote}`;
      await fb.db.update(
        "cookie",
        { userId: message.senderUserID },
        {
          $set: {
            total: userCookieStats.total - 1,
            sloted: userCookieStats.sloted + 1,
            usedSlot: true,
          },
        }
      );

      // increase jackpot by adding 1 cookie to folhinhabot
      // await client.db.update('cookie', { userId: process.env.BOT_USERID }, { $inc: { total: 1 } });
    }

    return {
      reply: reply,
    };
  }

  return {
    reply: `Está com dúvidas sobre os comandos de cookie? Acesse https://folhinhabot.com/comandos/cookie 😁`,
  };
};

cookieCommand.commandName = "cookie";
cookieCommand.aliases = ["cookie", "cookies"];
cookieCommand.shortDescription =
  "Faça várias coisas relacionadas com os cookies";
cookieCommand.cooldown = 5000;
cookieCommand.cooldownType = "user";
cookieCommand.whisperable = true;
cookieCommand.description = `!Cookie diario/daily: Receba um cookie. O comando poderá ser reutilizado todo dia a partir das cinco horas da manhã (horário de Brasília). Há de aliase o comando "cd" de mesma funcionalidade.

!Cookie open: Abra um dos seus cookies para receber uma poderosa mensagem de reflexão.

!Cookie gift/give: Ofereça um dos seus cookies a outro usuario, uma vez presenteado, poderá presentear novamente no próximo ciclo do cookie diário.

!Cookie slot: Aposte um dos seus cookies e tenha a chance de ganhar 3 ou 10 cookies. Poderá apostar novamente no próximo ciclo do cookie diário.

!Cookie show: Exibe estatísticas de cookies. Quando não mencionado um usuário, exibirá as estatísticas de quem realizou o comando.

!Cookie top: Exiba os cinco usuários com mais cookies e a sua posição no ranking global. Use "!cookie top gift" e "!cookie top slot" para exibir os maiores presenteadores e apostadores, respectivamente, e a sua posição no ranking específico.`;
cookieCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/src/commands/${__dirname.split(path.sep).pop()}/${__filename.split(path.sep).pop()}`;

module.exports = {
  cookieCommand,
  loadUserCookieStats,
  createUserCookieBase,
  getTimeUntilNext9AM,
};
