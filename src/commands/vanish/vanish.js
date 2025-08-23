// TODO: fix, continue from here
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

  const vanish = await fb.twitch.timeoutUser(message, 1, "vanish");

  if (!vanish) {
    return {
      reply: `Eu não tenho mod, então não consigo fazer isso`,
      notes: `Vanish command failed - bot lacks moderator permissions`,
    };
  }

  return {
    reply: `✨ Poof! Você desapareceu!`,
    notes: `Vanish command executed successfully - 1 second timeout applied`,
  };
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
vanishCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/src/commands/${__dirname
  .split("/")
  .pop()}/${__filename.split("/").pop()}`;

module.exports = {
  vanishCommand,
};
