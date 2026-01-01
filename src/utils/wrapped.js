const { getBanStats, humanizedTime } = require("../commands/banstats/banstats");

const START_DATE = new Date("2025-01-01");
const END_DATE = new Date("2026-01-01");

const CACHE_DURATION_MS = 30 * 60 * 1000; // 30 minutes
const wrappedCache = new Map();

async function getWrapped(username) {
  const now = Date.now();

  // Check cache
  const cached = wrappedCache.get(username?.toLowerCase?.());
  if (cached && cached.expiry > now && typeof cached.data === "object") {
    return cached.data;
  }

  const userInfo = await fb.api.helix.getUserByUsername(username);
  if (!userInfo) {
    return { statusCode: 404, errorMessage: "User not found" };
  }

  const userColor = await fb.api.helix.getColor(userInfo.id);
  userInfo.color = userColor.color || null;

  // commands count since 1-1-2025
  const commandsCount = await fb.db.count(
    "commandlog",
    {
      userId: userInfo.id,
      sentDate: { $gte: START_DATE, $lte: END_DATE },
    },
    true
  );

  // top 5 most used commands
  const mostUsedCommands = await fb.db.aggregate("commandlog", [
    {
      $match: {
        userId: userInfo.id,
        sentDate: { $gte: START_DATE, $lte: END_DATE },
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

  // days where user sent at least 1 command
  const activeDays = await fb.db.aggregate("commandlog", [
    {
      $match: {
        userId: userInfo.id,
        sentDate: { $gte: START_DATE, $lte: END_DATE },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$sentDate" },
        },
        count: { $sum: 1 },
      },
    },
    {
      $count: "activeDays",
    },
  ]);

  // reminders sent/received
  const sentReminders = await fb.db.count(
    "remind",
    {
      senderId: userInfo.id,
      remindTime: {
        $gte: fb.utils.unix(START_DATE),
        $lte: fb.utils.unix(END_DATE),
      },
    },
    true
  );

  const receivedReminders = await fb.db.count(
    "remind",
    {
      receiverId: userInfo.id,
      remindTime: {
        $gte: fb.utils.unix(START_DATE),
        $lte: fb.utils.unix(END_DATE),
      },
    },
    true
  );

  // pet interactions
  const carinhoPetCount = await fb.db.count(
    "commandlog",
    {
      userId: userInfo.id,
      sentDate: { $gte: START_DATE, $lte: END_DATE },
      command: "carinho",
    },
    true
  );

  const brincarPetCount = await fb.db.count(
    "commandlog",
    {
      userId: userInfo.id,
      sentDate: { $gte: START_DATE, $lte: END_DATE },
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
    const startTimestamp = Math.floor(START_DATE.getTime() / 1000);
    const endTimestamp = Math.floor(END_DATE.getTime() / 1000);

    const msgCount = await fb.clickhouse.query(
      `
        SELECT
          user_id,
          COUNT(*) AS message_count
        FROM message_structured
        WHERE
          user_id = {userId:String}
          AND message_type = 1
          AND timestamp >= {startTimestamp:UInt32}
          AND timestamp <= {endTimestamp:UInt32}
        GROUP BY user_id
     `,
      { userId: userInfo.id, startTimestamp, endTimestamp }
    );

    const top5Channels = await fb.clickhouse.query(
      `
        SELECT
          channel_login,
          COUNT(*) AS message_count
        FROM message_structured
        WHERE
          user_id = {userId:String}
          AND message_type = 1
          AND timestamp >= {startTimestamp:UInt32}
          AND timestamp <= {endTimestamp:UInt32}
        GROUP BY channel_login
        ORDER BY message_count DESC
        LIMIT 5
     `,
      { userId: userInfo.id, startTimestamp, endTimestamp }
    );

    msgCountData = msgCount.data || msgCount;
    top5ChannelsData = top5Channels.data || top5Channels;
  }

  const banStats = await getBanStats(userInfo.id);

  const result = {
    statusCode: 200,
    userId: userInfo.id,
    username: userInfo.login,
    displayName: userInfo.displayName,
    profilePicture: userInfo.profileImageUrl,
    color: userInfo.color,
    data: {
      activeDays: activeDays?.[0]?.activeDays || 0,
      reminders: {
        sent: sentReminders,
        received: receivedReminders,
      },
      pets: {
        carinho: carinhoPetCount,
        brincar: brincarPetCount,
      },
      bans: {
        bans: banStats.bans,
        timeouts: banStats.timeouts,
        timeoutsDuration: banStats.timeoutsDuration,
        humanizedTime: humanizedTime(banStats.timeoutsDuration),
      },
      msgCount: {
        count: msgCountData[0]?.message_count || 0,
        top: top5ChannelsData,
      },
      cmdCount: {
        count: commandsCount,
        top: mostUsedCommandsObject,
      },
    },
  };

  wrappedCache.set(username.toLowerCase(), {
    data: result,
    expiry: now + CACHE_DURATION_MS,
  });

  return result;
}

module.exports = { getWrapped };
