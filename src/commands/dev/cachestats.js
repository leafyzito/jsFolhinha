const cacheStatsCommand = async (message) => {
  message.command = "dev cachestats";

  try {
    const cacheStats = await fb.db.getCacheStats();
    const hitRatio = await fb.db.getCacheHitRatio();

    // Calculate summary stats
    let totalCached = 0;
    let totalMax = 0;
    let collectionCount = 0;

    for (const [, stats] of Object.entries(cacheStats)) {
      totalCached += stats.size;
      totalMax += stats.max;
      collectionCount++;
    }

    const cacheUsage = ((totalCached / totalMax) * 100).toFixed(1);

    let reply = `📊 Cache: ${totalCached}/${totalMax} (${cacheUsage}%) | Hit: ${hitRatio} | Collections: ${collectionCount}`;

    // Truncate if over 500 characters
    if (reply.length > 500) {
      reply = reply.substring(0, 490) + "...";
    }

    return {
      reply: reply,
    };
  } catch (err) {
    return {
      reply: `Erro ao obter estatísticas do cache: ${err.message}`,
    };
  }
};

// Command metadata
cacheStatsCommand.commandName = "cachestats";
cacheStatsCommand.aliases = ["cachestats", "cstats"];
cacheStatsCommand.shortDescription = "Display cache statistics and hit ratio";
cacheStatsCommand.cooldown = 0;
cacheStatsCommand.cooldownType = "user";
cacheStatsCommand.permissions = ["admin"];
cacheStatsCommand.whisperable = false;

module.exports = { cacheStatsCommand };
