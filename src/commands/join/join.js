// TODO: test
const joinCommand = async (message) => {
  const channelToJoin = message.senderUsername;
  const alreadyJoinedChannels = fb.twitch.anonClient.currentChannels.map((c) => c.name.replace("#",""));

  if (alreadyJoinedChannels.includes(channelToJoin)) {
    return {
      reply: `Eu já estou no seu chat! O meu prefixo lá é ${
        fb.db.get("config", { channel: channelToJoin })?.prefix || "!"
      }`,
    };
  }

  await fb.utils.createNewChannelConfig(message.senderUserID);
  const joinResult = fb.twitch.join([channelToJoin]);
  if (!joinResult) {
    return {
      reply: `Erro ao entrar no chat ${channelToJoin}. Contacte o @${process.env.DEV_NICK}`,
    };
  }

  const emote = await fb.emotes.getEmoteFromList(
    channelToJoin,
    ["peepohey", "heyge"],
    "KonCha"
  );
  fb.log.send(
    channelToJoin,
    `${emote} Oioi! Fui convidado para me juntar aqui! Para saber mais sobre mim, pode usar !ajuda ou !comandos`
  );

  const happyEmote = await fb.emotes.getEmoteFromList(
    message.channelName,
    fb.emotes.happyEmotes
  );

  const channelId = (await fb.api.helix.getUserByUsername(channelToJoin))?.id;
  if (channelId) {
    fb.log.whisper(
      channelId,
      `Caso tenha follow-mode ativado no seu chat, me dê cargo de moderador para conseguir falar lá :D`
    );
  }

  return {
    reply: `Entrei no chat ${message.senderUsername} com sucesso! Tô lá te esperando! ${happyEmote} Caso tenha follow-mode ativado, me dê cargo de moderador no seu chat para conseguir falar lá`,
  };
};

joinCommand.commandName = "join";
joinCommand.aliases = ["join", "entrar"];
joinCommand.shortDescription = "Convide o bot para entrar no seu chat";
joinCommand.cooldown = 5000;
joinCommand.cooldownType = "user";
joinCommand.whisperable = true;
joinCommand.description = `Utilize o comando !join num chat no qual o Folhinha esteja presente e faça com que o bot entre no chat de quem executou o comando

Se quiser convidar o bot para um chat que você modera, acesse <a href="https://folhinhabot.com/" target="_blank" style="color: #67e8f9">a página principal do site</a> e na aba de "Convidar para um canal que você modera" coloque o canal para o qual você deseja convidar o bot

Caso tenha follow-mode ativado no chat, o bot não conseguirá falar. Para resolver isso, dê cargo de moderador ou vip ao Folhinha`;
joinCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/${joinCommand.commandName}/${joinCommand.commandName}.js`;

module.exports = {
  joinCommand,
};
