const path = require("path");

async function getBanStats(userid) {
  // Query for number of timeouts for the user
  const timeoutsCountRes = await fb.clickhouse.query(
    `
      SELECT COUNT(*) AS count FROM message_structured 
      WHERE user_id = {userId:String}
      AND has(extra_tags, 'target-user-id')
      AND has(extra_tags, 'ban-duration')
    `,
    { userId: userid }
  );

  // Query for number of bans for the user (without ban-duration)
  const bansCountRes = await fb.clickhouse.query(
    `
      SELECT COUNT(*) AS count FROM message_structured 
      WHERE user_id = {userId:String}
      AND has(extra_tags, 'target-user-id')
      AND NOT has(extra_tags, 'ban-duration')
    `,
    { userId: userid }
  );

  const bans = parseInt(
    (bansCountRes.data && bansCountRes.data[0]?.count) || 0
  );
  const timeouts = parseInt(
    (timeoutsCountRes.data && timeoutsCountRes.data[0]?.count) || 0
  );

  return {
    bans,
    timeouts,
  };
}

const banStatsCommand = async (message) => {
  const bansTarget =
    message.args[1]?.replace(/^@/, "") || message.senderUsername;
  const bansTargetId = (await fb.api.helix.getUserByUsername(bansTarget))?.id;
  if (!bansTargetId) {
    return {
      reply: "Esse usuário não existe",
    };
  }

  const banStats = await getBanStats(bansTargetId);

  return {
    reply: `🔨 ${bansTarget} foi banido ${banStats.bans} vezes e levou timeout ${banStats.timeouts} vezes em todos os canais logados`,
  };
};

banStatsCommand.commandName = "banstats";
banStatsCommand.aliases = ["banstats", "bans"];
banStatsCommand.shortDescription =
  "Veja quantos bans/timeouts registrados você tem nos canais com o bot";
banStatsCommand.cooldown = 5000;
banStatsCommand.cooldownType = "channel";
banStatsCommand.whisperable = true;
banStatsCommand.description = `Veja quantos bans e/ou timeouts você (ou um usuário fornecido) tem registrados em todos os canais onde o bot está`;
banStatsCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/src/commands/${__dirname
  .split(path.sep)
  .pop()}/${__filename.split(path.sep).pop()}`;

module.exports = {
  banStatsCommand,
};
