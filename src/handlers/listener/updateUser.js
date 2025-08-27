async function updateLastSeen(message) {
  const update_doc = {
    $set: {
      lsDate: Math.floor(Date.now() / 1000),
      lsChannel: message.channelName,
      lsMessage: message.messageText,
    },
    $inc: {
      "msgCount.total": 1,
      [`msgCount.${message.channelName}`]: 1,
    },
  };

  await fb.db.update("users", { userid: message.senderUserID }, update_doc);
  return;
}

const updateUserListener = async (message) => {
  if (message.senderUsername === process.env.BOT_USERNAME) {
    return;
  }

  // Check if user is already known in the database
  const knownUser = await fb.db.get("users", {
    userid: message.senderUserID,
  });

  if (knownUser && knownUser.currAlias === message.senderUsername) {
    // User is known and username hasn't changed, just update last seen
    return await updateLastSeen(message);
  }

  if (knownUser && knownUser.currAlias !== message.senderUsername) {
    // Username has changed, update aliases and handle channel config updates if applicable
    fb.discord.log(
      `* Updating user aliases: #${message.channelName}/${knownUser.currAlias} -> ${message.senderUsername}`
    );
    console.log(
      `User found in DB. updating aliases: #${message.channelName}/${knownUser.currAlias} -> ${message.senderUsername}`
    );

    await fb.db.update(
      "users",
      { userid: message.senderUserID },
      {
        $set: { currAlias: message.senderUsername },
        $push: { aliases: message.senderUsername },
      }
    );

    // Get channel config from database and update if applicable
    const channelConfig = await fb.db.get("config", {
      channelId: message.senderUserID,
    });

    if (channelConfig) {
      fb.discord.log(
        `* Updating channel config for ${knownUser.currAlias} -> ${message.senderUsername}`
      );
      console.log(
        `Updating channel config for ${knownUser.currAlias} -> ${message.senderUsername}`
      );

      await fb.db.update(
        "config",
        { channelId: message.senderUserID },
        { $set: { channel: message.senderUsername } }
      );

      // Handle Twitch client operations for channel changes
      fb.twitch.part(knownUser.currAlias);
      const joinResult = fb.twitch.join([message.senderUsername]);
      if (!joinResult) {
        fb.discord.importantLog(
          `Error joining ${message.senderUsername} after username change`
        );
      }

      fb.log.send(
        message.senderUsername,
        `Troca de nick detetada: ${knownUser.currAlias} -> ${message.senderUsername}`
      );
    }

    await updateLastSeen(message);
    return;
  }

  // New user - create in database
  fb.discord.log(
    `* NEW USER: #${message.channelName}/${message.senderUsername}`
  );
  console.log(`NEW USER: #${message.channelName}/${message.senderUsername}`);

  await fb.db.insert("users", {
    userid: message.senderUserID,
    aliases: [message.senderUsername],
    currAlias: message.senderUsername,
    customAliases: [],
    lsChannel: message.channelName,
    lsMessage: message.messageText,
    lsDate: Math.floor(Date.now() / 1000),
    optoutLs: false,
    optoutStalk: false,
    optoutRemind: false,
    optoutOwnChannel: false,
    blocks: {},
    msgCount: { total: 1, [message.channelName]: 1 },
  });
};

module.exports = {
  updateUserListener,
};
