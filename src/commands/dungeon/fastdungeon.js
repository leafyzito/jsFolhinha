const {
  dungeonData,
  loadUserDungeonStats,
  checkDungeonCooldown,
  setNewCooldown,
} = require("./dungeon.js");

const fastDungeonCommand = async (message) => {
  const userDungeonStats = await loadUserDungeonStats(message);
  const [canDungeon, remainingTime] = await checkDungeonCooldown(
    userDungeonStats
  );
  if (!canDungeon) {
    return {
      reply: `Você se sente cansado... Só vai se sentir capaz de explorar novamente em ${remainingTime} ⏰`,
    };
  }

  const dungeon = dungeonData[Math.floor(Math.random() * dungeonData.length)];

  const option = fb.utils.randomChoice(["1", "2"]);
  let result = fb.utils.randomInt(1, 3) <= 2 ? "win" : "lose"; // 2/3 chance of winning
  if (userDungeonStats.level <= 1) {
    // if user level is 1, force win
    result = "win";
  }
  let responseMessage = `${fb.utils.capitalize(dungeon.quote)} Você decide ${
    dungeon[option].option
  } e `;

  if (result === "win") {
    const experienceGain =
      fb.utils.randomInt(50, 75) + 3 * userDungeonStats.level;
    const experienceNeededForLvlUp =
      100 * userDungeonStats.level +
      25 * ((userDungeonStats.level * (userDungeonStats.level + 1)) / 2);

    if (userDungeonStats.xp + experienceGain >= experienceNeededForLvlUp) {
      const emote = await fb.emotes.getEmoteFromList(
        message.channelName,
        fb.emotes.pogEmotes,
        "PogChamp"
      );

      await fb.db.update(
        "dungeon",
        { userId: message.senderUserID },
        { $inc: { xp: experienceGain, wins: 1, level: 1 } }
      );

      const timeToWait = await setNewCooldown(message, result);
      responseMessage += `${dungeon[option][result]}! [+${Math.round(
        experienceGain
      ).toLocaleString("fr-FR")} ⇒ ${Math.round(
        userDungeonStats.xp + experienceGain
      ).toLocaleString("fr-FR")} XP] ⬆ subiu para o nível ${
        userDungeonStats.level + 1
      }! ${emote} (descanse por ${timeToWait} ⏰)`;
    } else {
      await fb.db.update(
        "dungeon",
        { userId: message.senderUserID },
        { $inc: { xp: experienceGain, wins: 1 } }
      );

      const timeToWait = await setNewCooldown(message, result);
      responseMessage += `${dungeon[option][result]}! [+${Math.round(
        experienceGain
      ).toLocaleString("fr-FR")} ⇒ ${Math.round(
        userDungeonStats.xp + experienceGain
      ).toLocaleString("fr-FR")} XP] (descanse por ${timeToWait} ⏰)`;
    }
  } else {
    await fb.db.update(
      "dungeon",
      { userId: message.senderUserID },
      { $inc: { losses: 1 } }
    );
    const timeToWait = await setNewCooldown(message, result);
    responseMessage += `${
      dungeon[option][result]
    }! [+0 ⇒ ${userDungeonStats.xp.toLocaleString(
      "fr-FR"
    )} XP] (descanse por ${timeToWait} ⏰)`;
  }

  return {
    reply: responseMessage,
  };
};

fastDungeonCommand.commandName = "dungeon";
fastDungeonCommand.aliases = ["fastdungeon", "fd"];
fastDungeonCommand.shortDescription =
  "Entre em uma dungeon e tenha o seu destino escolhido aleatoriamente";
fastDungeonCommand.cooldown = 30_000;
fastDungeonCommand.cooldownType = "user";
fastDungeonCommand.whisperable = true;
fastDungeonCommand.description = `Você entrará em uma dungeon aleatória e terá um destino aleatório
Após cada dungeon, o usuário entrará em um cooldown aleatório de 30 minutos a 2 horas e 30 minutos

O XP ganho depende do nível que você atingiu, e é calculado assim:
XP = 50~75 + 3 * Nível do player

O XP necessário para subir de nível é calculado assim:
XP necessário para subir de nível = 100 * Nível do player + 25 * (Nível do player * (Nível do player + 1) / 2)`;
fastDungeonCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/src/commands/${__dirname
  .split("/")
  .pop()}/${__filename.split("/").pop()}`;

module.exports = { fastDungeonCommand };
