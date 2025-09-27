const path = require("path");
async function getDne() {
  const url = "https://this-person-does-not-exist.com/new";
  const res = await fb.got(url);
  if (!res) return null;

  const img = res.src;
  const result = `https://this-person-does-not-exist.com${img}`;
  const shortResult = await fb.api.chuw.shortenUrl(result);
  return shortResult;
}

const dneCommand = async () => {
  const dne = await getDne();

  if (!dne) {
    return {
      reply: `Erro ao obter imagem, tente novamente`,
    };
  }

  return {
    reply: dne,
  };
};

dneCommand.commandName = "doesnotexist";
dneCommand.aliases = ["dne", "thispersondoesnotexist", "doesnotexist"];
dneCommand.shortDescription =
  "Mostra uma imagem aleatória de uma pessoa que não existe";
dneCommand.cooldown = 5000;
dneCommand.cooldownType = "channel";
dneCommand.whisperable = true;
dneCommand.description =
  "Veja uma foto aleatória gerada pelo site thispersondoesnotexist.com";
dneCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/src/commands/${__dirname.split(path.sep).pop()}/${__filename.split(path.sep).pop()}`;

module.exports = {
  dneCommand,
};
