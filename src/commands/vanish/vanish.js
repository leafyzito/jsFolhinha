const path = require("path");
const vanishCommand = async (message) => {
  if (message.isStreamer) {
    return {
      reply: `Eu não consigo te fazer desaparecer, mas você consegue monkaS`,
    };
  }

  if (message.isMod) {
    return {
      reply: `Você não consegue se esconder aqui Stare`,
    };
  }

  const vanish = await fb.api.helix.timeoutUser(
    message.channelID,
    message.senderUserID,
    1,
    "vanish"
  );

  if (!vanish) {
    return {
      reply: `Eu não tenho mod, então não consigo fazer isso`,
    };
  }

  return;
};

vanishCommand.commandName = "vanish";
vanishCommand.aliases = ["vanish"];
vanishCommand.shortDescription = "Limpe as suas mensagens do chat";
vanishCommand.cooldown = 5000;
vanishCommand.cooldownType = "user";
vanishCommand.whisperable = false;
vanishCommand.description = `O clássico vanish
Use este comando para tomar um timeout de 1 segundo e apagar as sua mensagens do chat

Para este comando funcione corretamente, o Folhinha precisa do cargo de moderador`;
vanishCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/src/commands/${__dirname.split(path.sep).pop()}/${__filename.split(path.sep).pop()}`;

module.exports = {
  vanishCommand,
};
