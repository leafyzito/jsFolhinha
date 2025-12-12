const allEmotesCommand = async (message) => {
  const targetChannel =
    message.messageText.split(" ")[1] || message.channelName;
  const channelEmotes = await fb.emotes.getChannelEmotes(targetChannel);
  fb.log.reply(message, `${channelEmotes.length} emotes no total`);

  // send all emotes in chunks of 490 characters
  let emoteMessage = "";
  for (let i = 0; i < channelEmotes.length; i++) {
    if ((emoteMessage + ` ${channelEmotes[i]} `).length > 490) {
      fb.log.send(message.channelName, emoteMessage);
      emoteMessage = "";
    }
    emoteMessage += ` ${channelEmotes[i]} `;
  }
  if (emoteMessage.length > 0) {
    fb.log.send(message.channelName, emoteMessage);
  }
};

// Command metadata
allEmotesCommand.commandName = "allemotes";
allEmotesCommand.aliases = ["allemotes"];
allEmotesCommand.shortDescription = "[DEV] Lista todos os emotes de um canal";
allEmotesCommand.cooldown = 5_000;
allEmotesCommand.cooldownType = "user";
allEmotesCommand.permissions = ["admin"];
allEmotesCommand.whisperable = false;
allEmotesCommand.flags = ["dev"];
allEmotesCommand.description = `Mostra todos os emotes (BTTV, FFZ, 7TV) do canal especificado. O comando envia a lista de emotes em partes, respeitando o limite de caracteres do chat.
  
• Exemplo: !allemotes - Lista todos os emotes do canal atual
• Exemplo: !allemotes canalexemplo - Lista todos os emotes do canal "canalexemplo"`;

module.exports = { allEmotesCommand };
