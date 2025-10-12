const cacheStatsCommand = async () => {
  try {
    const cacheStats = await fb.db.getCacheStats();
    const hitRatio = await fb.db.getCacheHitRatio();

    // Calculate summary stats
    let totalCached = 0;
    let totalMax = 0;
    let collectionCount = 0;
    let totalHits = 0;
    let totalMisses = 0;

    for (const [, stats] of Object.entries(cacheStats)) {
      totalCached += stats.size;
      totalMax += stats.max;
      collectionCount++;
      totalHits += stats.hits || 0;
      totalMisses += stats.misses || 0;
    }

    const cacheUsage = ((totalCached / totalMax) * 100).toFixed(1);

    let reply = `📊 Cache: ${totalCached} size (${cacheUsage}%) • Hits/Misses: ${totalHits}/${totalMisses} • Hit Ratio: ${hitRatio} • Collections: ${collectionCount}`;

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
cacheStatsCommand.cooldown = 5_000;
cacheStatsCommand.cooldownType = "user";
cacheStatsCommand.permissions = ["admin"];
cacheStatsCommand.whisperable = false;
cacheStatsCommand.flags = ["dev"];

module.exports = { cacheStatsCommand };
