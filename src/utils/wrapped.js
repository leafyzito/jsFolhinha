const START_DATE = new Date("2025-01-01");

async function getWrapped(username) {
  const userInfo = await fb.api.helix.getUserByUsername(username);
  if (!userInfo) {
    return { statusCode: 404, errorMessage: "User not found" };
  }

  // commands count since 1-1-2025
  const commandsCount = await fb.db.count("commandlog", {
    userId: userInfo.id,
    sentDate: { $gte: START_DATE },
  });

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

  const mostUsedCommandsObject = mostUsedCommands.map((command) => ({
    command: command._id,
    count: command.count,
  }));

  // get msg count
  const msgCount = await fb.clickhouse.query(
    `
      SELECT
        user_id,
        COUNT(*) AS message_count
      FROM message_structured
      WHERE
        created_at >= toStartOfYear(now())
      GROUP BY user_id

   `
  );

  // Access the data array from ClickHouse result
  const msgCountData = msgCount.data || msgCount;

  return {
    statusCode: 200,
    userId: userInfo.id,
    username: userInfo.login,
    displayName: userInfo.displayName,
    msgCount: msgCountData,
    commandsCount: commandsCount,
    mostUsedCommands: mostUsedCommandsObject,
  };
}

module.exports = { getWrapped };
