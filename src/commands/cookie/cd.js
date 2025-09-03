const {
  loadUserCookieStats,
  createUserCookieBase,
  getTimeUntilNext9AM,
} = require("./cookie");

const cookieDiarioCommand = async (message) => {
  const userCookieStats = await loadUserCookieStats(message.senderUserID);
  if (!userCookieStats) {
    await createUserCookieBase(message);
    return {
      reply: `Você resgatou seu cookie diário e agora tem 1 cookie! 🍪`,
    };
  }

  if (userCookieStats.claimedToday) {
    const timeLeftString = getTimeUntilNext9AM();

    return {
      reply: `Você já resgatou o seu cookie diário hoje. Volte em ${timeLeftString} para resgatar o seu cookie diário novamente ⌛`,
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
};

cookieDiarioCommand.commandName = "cd";
cookieDiarioCommand.aliases = ["cd"];
cookieDiarioCommand.shortDescription = "Resgate o seu cookie diário";
cookieDiarioCommand.cooldown = 5000;
cookieDiarioCommand.cooldownType = "user";
cookieDiarioCommand.whisperable = true;
cookieDiarioCommand.description =
  "Uso: !cd; Resposta esperada: Você resgatou seu cookie diário e agora tem {cookies}";
cookieDiarioCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/src/commands/${__dirname
  .split("/")
  .pop()}/${__filename.split("/").pop()}`;

module.exports = {
  cookieDiarioCommand,
};
