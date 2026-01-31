const path = require("path");
const brincarCommand = async (message) => {
  const petStats = await fb.db.get("pet", { channelId: message.channelID });

  if (!petStats || !petStats.is_alive) {
    return {
      reply: `Não existe um pet para este chat. Para criar um pet, use ${message.prefix}pet criar`,
    };
  }

  if (petStats.warns === 2 && fb.utils.randomInt(1, 2) === 1) {
    return {
      reply: `${petStats.pet_emoji} ${petStats.pet_name} tá rabugento e não quis brincar com você`,
    };
  }

  const update_doc = {
    $set: {
      total_plays: petStats.total_plays + 1,
      warns: 0,
      last_interaction: Math.floor(Date.now() / 1000),
      last_play: Math.floor(Date.now() / 1000),
    },
  };

  await fb.db.update("pet", { channelId: message.channelID }, update_doc);

  const tesouros = [
    `um osso de ouro`,
    `um diamante`,
    `um pedaço de queijo podre`,
    `a minha vontade de viver`,
    `uma chave secreta`,
    `um mapa do tesouro`,
    `um mapa misterioso`,
    `R$ ${fb.utils.randomInt(1, 1000000)} enterrados`,
  ];

  const brincadeiras = [
    `${message.displayName} brincou com ${petStats.pet_emoji} ${petStats.pet_name} de apanhar a bola ⚽ mas o pet ficou só olhando`,
    `${message.displayName} brincou com ${petStats.pet_emoji} ${
      petStats.pet_name
    } de esconde-esconde 🙈 e você conseguiu encontrar o pet em ${fb.utils.randomInt(
      3,
      15,
    )} minutos! 🏆`,
    `${message.displayName} brincou com ${petStats.pet_emoji} ${petStats.pet_name} de esconde-esconde 🙈 mas não conseguiu encontrar o pet, ele é muito bom! 🏆`,
    `${message.displayName} brincou com ${petStats.pet_emoji} ${
      petStats.pet_name
    } de pega-pega 🏃‍♂️ e você conseguiu pegar o pet em ${fb.utils.randomInt(
      3,
      15,
    )} minutos! 🏆`,
    `${message.displayName} brincou com ${petStats.pet_emoji} ${petStats.pet_name} de pega-pega 🏃‍♂️ mas o pet é muito rápido e você não conseguiu pegar ele! 🏆`,
    `${message.displayName} brincou com ${petStats.pet_emoji} ${petStats.pet_name} de luta de travesseiro e você conseguiu vencer ao pet! 🏆`,
    `${message.displayName} brincou com ${petStats.pet_emoji} ${petStats.pet_name} de luta de travesseiro mas o pet é muito forte e destruiu você! 🏆`,
    `${message.displayName} brincou com ${petStats.pet_emoji} ${
      petStats.pet_name
    } de pular corda e vocês conseguiram pular ${fb.utils.randomInt(
      10,
      100,
    )} vezes seguidas! 🏆`,
    `${message.displayName} brincou com ${petStats.pet_emoji} ${petStats.pet_name} de pular corda mas você tropeçou e caiu! 🏆`,
    `${message.displayName} brincou com ${petStats.pet_emoji} ${petStats.pet_name} de olhar seriamente 👀 e você ganhou! 🏆`,
    `${message.displayName} brincou com ${petStats.pet_emoji} ${petStats.pet_name} de olhar seriamente 👀 mas o pet é muito sério e ganhou! 🏆`,
    `${message.displayName} brincou com ${petStats.pet_emoji} ${
      petStats.pet_name
    } de caça ao tesouro 🗺 e acharam ${fb.utils.randomChoice(tesouros)}`,
  ];

  const brincadeira = fb.utils.randomChoice(brincadeiras);
  return {
    reply: brincadeira,
  };
};

brincarCommand.commandName = "brincar";
brincarCommand.aliases = ["brincar", "play"];
brincarCommand.shortDescription = "Brinque com o pet do chat";
brincarCommand.cooldown = 5000;
brincarCommand.cooldownType = "channel";
brincarCommand.whisperable = false;
brincarCommand.description =
  "Brinque com o pet do canal e ajude a mantê-lo saudável.";
brincarCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/src/commands/${__dirname.split(path.sep).pop()}/${__filename.split(path.sep).pop()}`;

module.exports = { brincarCommand };
