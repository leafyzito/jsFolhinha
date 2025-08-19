async function getAscii(channel, input) {
  if (input.includes(".avif")) {
    input = input.replace(".avif", ".webp");
  }

  // if inoput is a link and doens't end with .avif or .webp, add .webp
  if (
    input.includes("http") &&
    !input.endsWith(".avif") &&
    !input.endsWith(".webp")
  ) {
    if (input.includes("//7tv.app/emotes/")) {
      input = input.replace("7tv.app/emotes/", "cdn.7tv.app/emote/");
    }

    if (!input.endsWith("/")) {
      input = input + "/";
    }

    input = input + "4x.webp";
  }

  // if no "#" in input, add "&c=defaultChannel"
  if (!input.includes("#")) {
    input = `${input}&c=${channel}`;
  } else {
    input = encodeURIComponent(input);
  }

  const api_url = `https://fun.joet.me/ascii?q=${input}`;
  const response = await fb.request(api_url);
  const data = await response.body.json();

  if (data.ok === false) {
    return null;
  }

  return data.msg;
}

const asciiCommand = async (message) => {
  // take as input the whole message but the command word
  const input = message.args.slice(1).join(" ");
  if (input.length === 0) {
    return {
      reply: `Use o formato: ${message.commandPrefix}ascii <emote>`,
    };
  }

  let ascii = await getAscii(message.channelName, input);
  if (!ascii) {
    return {
      reply: `Não encontrei esse emote neste canal`,
    };
  }

  // replace \n and \r with \s
  ascii = ascii.replace(/\n/g, " ").replace(/\r/g, " ");
  if (ascii.length > 499) {
    ascii = ascii.slice(0, 499);
  }

  return {
    reply: ascii,
  };
};

asciiCommand.commandName = "ascii";
asciiCommand.aliases = ["ascii"];
asciiCommand.shortDescription = "Veja o ascii de algum emote";
asciiCommand.cooldown = 5000;
asciiCommand.cooldownType = "channel";
asciiCommand.whisperable = false;
asciiCommand.description = `Exibe a arte ascii de algum emote fornecido
Se fornecido um canal específico, o bot irá buscar o emote no canal
Para emotes animados, o frame é escolhido aleatoriamente

• Exemplo: !ascii OMEGALUL - O bot irá mandar o ascii do emote OMEGALUL do canal atual
• Exemplo: !ascii xqcL #xqc - O bot irá mandar o ascii do emote xqcL no canal xqc

Pode também usar vários emotes como input
• Exemplo: !ascii OMEGALUL ALERT - O bot irá mandar o ascii do emote OMEGALUL e ALERT do canal atual juntos, como normalmente apareceria no chat
• Exemplo: !ascii xqcL #xql ALERT #leafyzito - O bot irá mandar o ascii do emote xqcL no canal xqc, e o ascii do emote ALERT no canal leafyzito juntos, como normalmente apareceria no chat
• Exemplo: !ascii OMEGALUL monkaS - O bot irá mandar o ascii do emote OMEGALUL e do monkaS um do lado do outro

Pode também passar o link direto do emote:
• Exemplo: !ascii https://cdn.7tv.app/emote/6042089e77137b000de9e669/4x.avif

Mais alguns input opcionais diretos do dev da API:
invert:true(default)|false
removeTransparency:false(default)|true
threshold:0-254(default: 127)
mode:simple(default)|ec|hc|nd`;
asciiCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/src/commands/${__dirname
  .split("/")
  .pop()}/${__filename.split("/").pop()}`;

module.exports = {
  asciiCommand,
};
