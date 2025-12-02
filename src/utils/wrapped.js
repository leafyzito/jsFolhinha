const START_DATE = new Date("2025-01-01");

async function getWrapped(username) {
  const userInfo = await fb.api.helix.getUserByUsername(username);
  if (!userInfo) {
    return { statusCode: 404, errorMessage: "User not found" };
  }

  // commands count since 1-1-2025
  const commandsCount = await fb.db.count(
    "commandlog",
    {
      userId: userInfo.id,
      sentDate: { $gte: START_DATE },
    },
    true
  );

  // top 5 most used commands
  const mostUsedCommands = await fb.db.aggregate("commandlog", [
    {
      $match: {
        userId: userInfo.id,
        sentDate: { $gte: START_DATE },
      },
    },
    {
      $group: {
        _id: "$command",
        count: { $sum: 1 },
      },
    },
    {
      $sort: { count: -1 },
    },
    {
      $limit: 5,
    },
  ]);

  // reminders sent/received
  const sentReminders = await fb.db.count(
    "remind",
    {
      senderId: userInfo.id,
      remindTime: { $lte: Math.floor(START_DATE / 1000) },
    },
    true
  );

  const receivedReminders = await fb.db.count(
    "remind",
    {
      receiverId: userInfo.id,
      remindTime: { $lte: Math.floor(START_DATE / 1000) },
    },
    true
  );

  // pet interactions
  const carinhoPetCount = await fb.db.count(
    "commandlog",
    {
      userId: userInfo.id,
      sentDate: { $gte: START_DATE },
      command: "carinho",
    },
    true
  );

  const brincarPetCount = await fb.db.count(
    "commandlog",
    {
      userId: userInfo.id,
      sentDate: { $gte: START_DATE },
      command: "brincar",
    },
    true
  );

  const mostUsedCommandsObject = mostUsedCommands.map((command) => ({
    command: command._id,
    count: command.count,
  }));

  let msgCountData = [{ message_count: 0 }];
  let top5ChannelsData = [];

  if (fb.clickhouse && fb.clickhouse.isConnected == true) {
    const msgCount = await fb.clickhouse.query(
      `
        SELECT
          user_id,
          COUNT(*) AS message_count
        FROM message_structured
        WHERE
          user_id = {userId:String}
          AND timestamp >= toStartOfYear(now())
        GROUP BY user_id
     `,
      { userId: userInfo.id }
    );

    const top5Channels = await fb.clickhouse.query(
      `
        SELECT
          channel_login,
          COUNT(*) AS message_count
        FROM message_structured
        WHERE
          user_id = {userId:String}
          AND timestamp >= toStartOfYear(now())
        GROUP BY channel_login
        ORDER BY message_count DESC
        LIMIT 5
     `,
      { userId: userInfo.id }
    );

    msgCountData = msgCount.data || msgCount;
    top5ChannelsData = top5Channels.data || top5Channels;
  }

  return {
    statusCode: 200,
    userId: userInfo.id,
    username: userInfo.login,
    displayName: userInfo.displayName,
    msgCount: {
      count: msgCountData[0]?.message_count || 0,
      top: top5ChannelsData,
    },
    cmdCount: {
      count: commandsCount,
      top: mostUsedCommandsObject,
    },
    reminders: {
      sent: sentReminders,
      received: receivedReminders,
    },
    pet: {
      carinho: carinhoPetCount,
      brincar: brincarPetCount,
    },
  };
}

module.exports = { getWrapped };
