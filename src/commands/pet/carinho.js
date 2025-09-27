const path = require("path");
const carinhoCommand = async (message) => {
  const petStats = await fb.db.get("pet", { channelId: message.channelID });

  if (!petStats || !petStats.is_alive) {
    return {
      reply: `Não existe um pet para este chat. Para criar um pet, use ${message.prefix}pet criar`,
    };
  }

  if (petStats.warns === 2 && fb.utils.randomInt(1, 2) === 1) {
    return {
      reply: `${petStats.pet_emoji} ${petStats.pet_name} tá rabugento e não aceitou o seu carinho`,
    };
  }

  const update_doc = {
    $set: {
      total_pats: petStats.total_pats + 1,
      warns: 0,
      last_interaction: Math.floor(Date.now() / 1000),
      last_pat: Math.floor(Date.now() / 1000),
    },
  };

  await fb.db.update("pet", { channelId: message.channelID }, update_doc);

  return {
    reply: `${petStats.pet_emoji} PETPET ${message.senderUsername} fez carinho em ${petStats.pet_emoji} ${petStats.pet_name}`,
  };
};

carinhoCommand.commandName = "carinho";
carinhoCommand.aliases = ["carinho", "pat"];
carinhoCommand.shortDescription = "Faça carinho no pet do chat";
carinhoCommand.cooldown = 5000;
carinhoCommand.cooldownType = "channel";
carinhoCommand.whisperable = false;
carinhoCommand.description =
  "Faça carinho no pet do canal e ajude a mantê-lo saudável.";
carinhoCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/src/commands/${__dirname.split(path.sep).pop()}/${__filename.split(path.sep).pop()}`;

module.exports = { carinhoCommand };
