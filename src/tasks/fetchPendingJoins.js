async function fetchPendingJoins() {
  const pendingJoins = await fb.db.get(
    "pendingjoin",
    { status: "pending" },
    true
  );

  // Check if pendingJoins exists and handle both single document and array cases
  if (!pendingJoins) {
    //    console.log("* No pending joins to process");
    return;
  }

  // Ensure we always work with an array
  const joinsArray = Array.isArray(pendingJoins)
    ? pendingJoins
    : [pendingJoins];

  for (const channelToJoin of joinsArray) {
    const channelId = channelToJoin.channelid;
    const channelName = (await fb.api.helix.getUserByID(channelId))?.login;
    const inviterId = channelToJoin.inviterid;
    const inviterName = (await fb.api.helix.getUserByID(inviterId))?.login;

    if (channelName) {
      const alreadyJoinedChannels = [...fb.twitch.anonClient.channelsToJoin];
      if (alreadyJoinedChannels.includes(channelName)) {
        console.log(`* ${channelName} is already joined`);
        await fb.db.update(
          "pendingjoin",
          { _id: channelToJoin._id },
          { $set: { status: "duplicate" } }
        );
        continue;
      }

      const userInfo = await fb.api.ivr.getUser(channelName);

      console.log(`* Joining ${channelName} to ${channelName}`);

      if (userInfo) {
        fb.discord.importantLog(
          `* Joining to ${channelName} from website (inviter: ${inviterName})\n${
            userInfo.isBanned ? `🚫 Banido: ${userInfo.banReason} • ` : ""
          }  @${userInfo.displayName} • ID: ${userInfo.userId} • Badge: ${
            userInfo.badge
          } • Chatters: ${userInfo.chatterCount} • Seguidores: ${
            userInfo.followers
          } • Criado há ${userInfo.createdHowLongAgo} (${userInfo.createdAt}) ${
            userInfo.isLive ? "• 🔴 Em live agora" : ""
          } ${
            userInfo.lastStream && !userInfo.isLive
              ? `• Última live: há ${userInfo.lastStream}`
              : ""
          }`
        );
      } else {
        fb.discord.importantLog(
          `* Joining to ${channelName} from website (inviter: ${inviterName})\nCould not fetch user info from API`
        );
      }

      fb.utils.createNewChannelConfig(channelId);

      fb.twitch.join([channelName]).catch((err) => {
        console.error(`Erro ao entrar no chat ${channelName}: ${err}`);
        fb.discord.importantLog(
          `* Error joining ${channelName} from website: ${err}`
        );
        fb.log.send(
          channelName,
          `Erro ao entrar no chat ${channelName}. Por favor contacte o @${process.env.DEV_NICK}`
        );
        fb.log.whisper(
          inviterId,
          `Erro ao entrar no chat ${channelName}. Por favor contacte o @${process.env.DEV_NICK}`
        );
        return;
      });

      const emote = await fb.emotes.getEmoteFromList(
        channelName,
        ["peepohey", "heyge"],
        "KonCha"
      );
      const inviterPart =
        inviterName != channelName ? ` por @${inviterName}` : "";
      fb.log.send(
        channelName,
        `${emote} Oioi! Fui convidado para me juntar aqui${inviterPart}! Para saber mais sobre mim, pode usar !ajuda ou !comandos`
      );
      fb.log.whisper(
        inviterId,
        `Caso tenha follow-mode ativado no chat para o qual me convidou, me dê cargo de moderador ou vip para conseguir falar lá :D`
      );

      await fb.db.update(
        "pendingjoin",
        { _id: channelToJoin._id },
        { $set: { status: "joined" } }
      );
    } else {
      console.log(`* ${channelToJoin.userid} not found from website`);
      fb.discord.importantLog(
        `* ${channelToJoin.userid} not found from website`
      );
      await fb.db.update(
        "pendingjoin",
        { _id: channelToJoin._id },
        { $set: { status: "user not found" } }
      );
    }
  }
}

module.exports = fetchPendingJoins;
