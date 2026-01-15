const { createClient } = require("redis");

class RedisClient {
  constructor(host, port, shouldUseRedis = true) {
    this.host = host;
    this.port = port;
    this.redisConnecting = false;
    this.cacheTTL = 24 * 60 * 60; // 24 hours in seconds

    // Initialize local cache as fallback
    this.localCache = new Map(); // key -> { value, expiresAt }
    this.localStats = new Map(); // key -> number

    // If Redis env vars are missing/empty, skip Redis and use local cache directly
    if (!shouldUseRedis) {
      this.useLocalCache = true;
      this.redisClient = null;

      // Only log to Discord if it's available (it might not be initialized yet)
      if (global.fb?.discord?.importantLog) {
        global.fb.discord.importantLog(
          "* Redis environment variables not configured, using local in-memory cache"
        );
      }
      return;
    }

    // Otherwise, try to connect to Redis
    this.useLocalCache = false;
    this.redisClient = this.createRedisClient(host, parseInt(port, 10));

    // Check connection after a short delay and fallback to local cache if needed
    this.checkConnectionAndFallback();
  }

  async checkConnectionAndFallback() {
    // Wait a bit for connection to establish
    await new Promise((resolve) => setTimeout(resolve, 2000));

    try {
      await this.ensureRedisConnection();
      // If we get here, Redis is connected
      this.useLocalCache = false;
    } catch {
      // Redis connection failed, use local cache
      console.log(
        "* Redis connection unavailable, using local in-memory cache"
      );
      if (global.fb?.discord?.importantLog) {
        global.fb.discord.importantLog(
          "* Redis connection unavailable, using local in-memory cache"
        );
      }
      this.useLocalCache = true;
    }
  }

  createRedisClient(host, port, isFallback = false) {
    const client = createClient({
      socket: {
        host: host,
        port: port,
        reconnectStrategy: (retries) => {
          // Stop retrying after 10 attempts
          if (retries > 10) {
            return false;
          }
          return Math.min(retries * 50, 1000);
        },
      },
    });

    client.on("error", (err) => {
      // Only log error if it's not a connection error that we're handling
      if (
        err.code !== "ENOTFOUND" ||
        host === "localhost" ||
        host === "127.0.0.1"
      ) {
        console.error("Redis Client Error:", err);
      }
    });

    client.on("connect", () => {
      console.log(`* Redis client connected to ${host}:${port}`);
    });

    // Connect to Redis with fallback logic
    if (!isFallback) {
      client.connect().catch(async (err) => {
        if (
          err.code === "ENOTFOUND" &&
          host !== "localhost" &&
          host !== "127.0.0.1" &&
          !this.redisConnecting
        ) {
          this.redisConnecting = true;
          console.log(
            `Cannot resolve ${host}, trying localhost as fallback...`
          );

          // Disconnect the old client
          try {
            if (client.isOpen || client.isReady) {
              await client.quit().catch(() => {
                // Ignore quit errors
              });
            }
            await client.disconnect().catch(() => {
              // Ignore disconnect errors
            });
          } catch {
            // Ignore errors when closing
          }

          // Create new client with localhost
          const fallbackClient = this.createRedisClient(
            "localhost",
            port,
            true
          );
          this.redisClient = fallbackClient;
          this.host = "localhost";
          try {
            await fallbackClient.connect();
            this.redisConnecting = false;
          } catch (fallbackErr) {
            this.redisConnecting = false;
            console.error(
              "Failed to connect to Redis (localhost fallback):",
              fallbackErr
            );
          }
        } else {
          console.error("Failed to connect to Redis:", err);
        }
      });
    } else {
      // For fallback client, connect immediately
      client.connect().catch((err) => {
        console.error("Failed to connect to Redis (fallback):", err);
      });
    }

    return client;
  }

  async ensureRedisConnection() {
    if (this.useLocalCache || !this.redisClient) {
      return; // Skip Redis if using local cache or Redis client not initialized
    }

    try {
      if (!this.redisClient.isOpen) {
        await this.redisClient.connect();
      }
    } catch {
      // Connection failed, switch to local cache
      if (!this.useLocalCache) {
        console.log(
          "* Redis connection lost, switching to local in-memory cache"
        );
        this.useLocalCache = true;
      }
    }
  }

  // Local cache helper methods
  getLocalCacheKey(collectionName, documentId) {
    return `cache:${collectionName}:${JSON.stringify(documentId)}`;
  }

  getLocalStatsKey(collectionName, statType) {
    return `stats:${collectionName}:${statType}`;
  }

  cleanupExpiredLocalCache() {
    const now = Date.now();
    for (const [key, entry] of this.localCache.entries()) {
      if (entry.expiresAt && entry.expiresAt < now) {
        this.localCache.delete(key);
      }
    }
  }

  getCacheKey(collectionName, documentId) {
    return `cache:${collectionName}:${JSON.stringify(documentId)}`;
  }

  getIndexKey(collectionName, fieldName, fieldValue) {
    return `index:${collectionName}:${fieldName}:${JSON.stringify(fieldValue)}`;
  }

  getStatsKey(collectionName, statType) {
    return `stats:${collectionName}:${statType}`;
  }

  // Define indexed fields for common query patterns
  getIndexedFields(collectionName) {
    const indexedFieldsMap = {
      config: ["channelId", "channel"],
      users: ["userid"],
      bans: ["userId"],
    };
    return indexedFieldsMap[collectionName] || [];
  }

  async incrementStat(collectionName, statType) {
    if (this.useLocalCache) {
      const key = this.getLocalStatsKey(collectionName, statType);
      const current = this.localStats.get(key) || 0;
      this.localStats.set(key, current + 1);
      return;
    }

    try {
      await this.ensureRedisConnection();
      const key = this.getStatsKey(collectionName, statType);
      await this.redisClient.incr(key);
    } catch {
      // Fallback to local cache on error
      if (!this.useLocalCache) {
        this.useLocalCache = true;
        const key = this.getLocalStatsKey(collectionName, statType);
        const current = this.localStats.get(key) || 0;
        this.localStats.set(key, current + 1);
      }
    }
  }

  async getStat(collectionName, statType) {
    if (this.useLocalCache) {
      const key = this.getLocalStatsKey(collectionName, statType);
      return this.localStats.get(key) || 0;
    }

    try {
      await this.ensureRedisConnection();
      const key = this.getStatsKey(collectionName, statType);
      const value = await this.redisClient.get(key);
      return value ? parseInt(value, 10) : 0;
    } catch {
      // Fallback to local cache on error
      if (!this.useLocalCache) {
        this.useLocalCache = true;
      }
      const key = this.getLocalStatsKey(collectionName, statType);
      return this.localStats.get(key) || 0;
    }
  }

  async setCache(collectionName, documentId, document) {
    // Build secondary indexes for common query fields
    const indexedFields = this.getIndexedFields(collectionName);
    const indexUpdates = [];

    // Check if document already exists to clean up old indexes
    const oldDoc = await this.getCache(collectionName, documentId);
    const oldIndexKeys = [];

    if (oldDoc) {
      for (const fieldName of indexedFields) {
        const oldValue = oldDoc[fieldName];
        if (oldValue !== undefined && oldValue !== null) {
          const newValue = document[fieldName];
          // If field value changed, mark old index for cleanup
          if (oldValue !== newValue) {
            oldIndexKeys.push(
              this.getIndexKey(collectionName, fieldName, oldValue)
            );
          }
        }
      }
    }

    for (const fieldName of indexedFields) {
      const fieldValue = document[fieldName];
      if (fieldValue !== undefined && fieldValue !== null) {
        indexUpdates.push({ fieldName, fieldValue });
      }
    }

    if (this.useLocalCache) {
      const key = this.getLocalCacheKey(collectionName, documentId);
      const expiresAt = Date.now() + this.cacheTTL * 1000;

      // Clean up old indexes
      for (const oldIndexKey of oldIndexKeys) {
        this.localCache.delete(oldIndexKey);
      }

      this.localCache.set(key, { value: document, expiresAt });

      // Update local cache indexes (store with same TTL as document)
      for (const { fieldName, fieldValue } of indexUpdates) {
        const indexKey = this.getIndexKey(
          collectionName,
          fieldName,
          fieldValue
        );
        this.localCache.set(indexKey, { value: documentId, expiresAt });
      }

      this.cleanupExpiredLocalCache();
      return;
    }

    try {
      await this.ensureRedisConnection();
      const key = this.getCacheKey(collectionName, documentId);

      // Clean up old indexes if values changed
      if (oldIndexKeys.length > 0) {
        await this.redisClient.del(oldIndexKeys);
      }

      // Set main cache document
      await this.redisClient.setEx(
        key,
        this.cacheTTL,
        JSON.stringify(document)
      );

      // Update secondary indexes
      for (const { fieldName, fieldValue } of indexUpdates) {
        const indexKey = this.getIndexKey(
          collectionName,
          fieldName,
          fieldValue
        );
        await this.redisClient.setEx(
          indexKey,
          this.cacheTTL,
          JSON.stringify(documentId)
        );
      }
    } catch {
      // Fallback to local cache on error
      if (!this.useLocalCache) {
        this.useLocalCache = true;
      }
      const key = this.getLocalCacheKey(collectionName, documentId);
      const expiresAt = Date.now() + this.cacheTTL * 1000;

      // Clean up old indexes
      for (const oldIndexKey of oldIndexKeys) {
        this.localCache.delete(oldIndexKey);
      }

      this.localCache.set(key, { value: document, expiresAt });

      // Update local cache indexes (store with same TTL as document)
      for (const { fieldName, fieldValue } of indexUpdates) {
        const indexKey = this.getIndexKey(
          collectionName,
          fieldName,
          fieldValue
        );
        this.localCache.set(indexKey, { value: documentId, expiresAt });
      }

      this.cleanupExpiredLocalCache();
    }
  }

  async getCache(collectionName, documentId) {
    if (this.useLocalCache) {
      const key = this.getLocalCacheKey(collectionName, documentId);
      const entry = this.localCache.get(key);
      if (entry) {
        // Check if expired
        if (entry.expiresAt && entry.expiresAt < Date.now()) {
          this.localCache.delete(key);
          return null;
        }
        return entry.value;
      }
      return null;
    }

    try {
      await this.ensureRedisConnection();
      const key = this.getCacheKey(collectionName, documentId);
      const value = await this.redisClient.get(key);
      if (value) {
        return JSON.parse(value);
      }
      return null;
    } catch {
      // Fallback to local cache on error
      if (!this.useLocalCache) {
        this.useLocalCache = true;
      }
      const key = this.getLocalCacheKey(collectionName, documentId);
      const entry = this.localCache.get(key);
      if (entry) {
        if (entry.expiresAt && entry.expiresAt < Date.now()) {
          this.localCache.delete(key);
          return null;
        }
        return entry.value;
      }
      return null;
    }
  }

  async deleteCache(collectionName, documentId) {
    if (this.useLocalCache) {
      const key = this.getLocalCacheKey(collectionName, documentId);
      this.localCache.delete(key);
      return;
    }

    try {
      await this.ensureRedisConnection();
      const key = this.getCacheKey(collectionName, documentId);
      await this.redisClient.del(key);
    } catch {
      // Fallback to local cache on error
      if (!this.useLocalCache) {
        this.useLocalCache = true;
      }
      const key = this.getLocalCacheKey(collectionName, documentId);
      this.localCache.delete(key);
    }
  }

  async getCacheSize(collectionName) {
    if (this.useLocalCache) {
      this.cleanupExpiredLocalCache();
      const prefix = `cache:${collectionName}:`;
      let count = 0;
      for (const key of this.localCache.keys()) {
        if (key.startsWith(prefix)) {
          count++;
        }
      }
      return count;
    }

    try {
      await this.ensureRedisConnection();
      const pattern = `cache:${collectionName}:*`;
      const keys = await this.redisClient.keys(pattern);
      return keys.length;
    } catch {
      // Fallback to local cache on error
      if (!this.useLocalCache) {
        this.useLocalCache = true;
      }
      this.cleanupExpiredLocalCache();
      const prefix = `cache:${collectionName}:`;
      let count = 0;
      for (const key of this.localCache.keys()) {
        if (key.startsWith(prefix)) {
          count++;
        }
      }
      return count;
    }
  }

  async searchCache(collectionName, query) {
    const queryKeys = Object.keys(query);
    const indexedFields = this.getIndexedFields(collectionName);

    // Try to use secondary index for fast O(1) lookup
    if (queryKeys.length === 1) {
      const key = queryKeys[0];
      const value = query[key];

      // If querying by _id, use direct cache lookup (already fast)
      if (key === "_id") {
        const doc = await this.getCache(collectionName, value);
        if (doc) {
          return [doc];
        }
        return [];
      }

      // If this is an indexed field, use secondary index for O(1) lookup
      if (indexedFields.includes(key)) {
        return await this.searchCacheByIndex(collectionName, key, value, query);
      }
    } else if (queryKeys.length > 1) {
      // For multi-field queries, try to use first indexed field
      for (const key of queryKeys) {
        if (indexedFields.includes(key)) {
          const value = query[key];
          const indexedMatches = await this.searchCacheByIndex(
            collectionName,
            key,
            value,
            query
          );
          if (indexedMatches.length > 0) {
            return indexedMatches;
          }
          // If indexed lookup found nothing, no need to scan
          return [];
        }
      }
    }

    // Fallback to scanning if no index available (for less common query patterns)
    return await this.searchCacheByScan(collectionName, query);
  }

  // Fast O(1) lookup using secondary index
  async searchCacheByIndex(collectionName, fieldName, fieldValue, fullQuery) {
    if (this.useLocalCache) {
      const indexKey = this.getIndexKey(collectionName, fieldName, fieldValue);
      const documentIdEntry = this.localCache.get(indexKey);

      if (!documentIdEntry) {
        return [];
      }

      // Check if index entry is expired
      if (documentIdEntry.expiresAt && documentIdEntry.expiresAt < Date.now()) {
        this.localCache.delete(indexKey);
        return [];
      }

      // Handle both wrapped ({value, expiresAt}) and plain documentId formats
      const documentId =
        documentIdEntry.value !== undefined
          ? documentIdEntry.value
          : documentIdEntry;
      const doc = await this.getCache(collectionName, documentId);

      if (!doc) {
        return [];
      }

      // For single-field queries, we're done. For multi-field, verify all fields match
      const queryKeys = Object.keys(fullQuery);
      if (queryKeys.length === 1) {
        return [doc];
      }

      // Verify all query fields match
      let isMatch = true;
      for (const [key, value] of Object.entries(fullQuery)) {
        if (doc[key] !== value) {
          isMatch = false;
          break;
        }
      }
      return isMatch ? [doc] : [];
    }

    try {
      await this.ensureRedisConnection();
      const indexKey = this.getIndexKey(collectionName, fieldName, fieldValue);
      const documentIdStr = await this.redisClient.get(indexKey);

      if (!documentIdStr) {
        return [];
      }

      const documentId = JSON.parse(documentIdStr);
      const doc = await this.getCache(collectionName, documentId);

      if (!doc) {
        return [];
      }

      // For single-field queries, we're done. For multi-field, verify all fields match
      const queryKeys = Object.keys(fullQuery);
      if (queryKeys.length === 1) {
        return [doc];
      }

      // Verify all query fields match
      let isMatch = true;
      for (const [key, value] of Object.entries(fullQuery)) {
        if (doc[key] !== value) {
          isMatch = false;
          break;
        }
      }
      return isMatch ? [doc] : [];
    } catch {
      // Fallback to local cache on error
      if (!this.useLocalCache) {
        this.useLocalCache = true;
      }
      return await this.searchCacheByIndex(
        collectionName,
        fieldName,
        fieldValue,
        fullQuery
      );
    }
  }

  // Fallback: slow scan for non-indexed queries (kept for backwards compatibility)
  async searchCacheByScan(collectionName, query) {
    if (this.useLocalCache) {
      this.cleanupExpiredLocalCache();
      const matches = [];
      const prefix = `cache:${collectionName}:`;

      for (const [cacheKey, entry] of this.localCache.entries()) {
        if (cacheKey.startsWith(prefix)) {
          const doc = entry.value;
          let isMatch = true;
          for (const [key, value] of Object.entries(query)) {
            if (doc[key] !== value) {
              isMatch = false;
              break;
            }
          }
          if (isMatch) {
            matches.push(doc);
          }
        }
      }
      return matches;
    }

    try {
      await this.ensureRedisConnection();
      const matches = [];
      // Use SCAN instead of KEYS for better performance (non-blocking)
      let cursor = 0;
      const pattern = `cache:${collectionName}:*`;

      do {
        const result = await this.redisClient.scan(cursor, {
          MATCH: pattern,
          COUNT: 100,
        });
        cursor = result.cursor;
        const keys = result.keys;

        if (keys.length > 0) {
          // Use MGET for bulk retrieval instead of individual GETs
          const values = await this.redisClient.mGet(keys);

          for (let i = 0; i < values.length; i++) {
            if (!values[i]) continue;

            try {
              const doc = JSON.parse(values[i]);
              let isMatch = true;
              for (const [key, value] of Object.entries(query)) {
                if (doc[key] !== value) {
                  isMatch = false;
                  break;
                }
              }
              if (isMatch) {
                matches.push(doc);
              }
            } catch {
              // Skip invalid JSON
              continue;
            }
          }
        }
      } while (cursor !== 0);

      return matches;
    } catch {
      // Fallback to local cache on error
      if (!this.useLocalCache) {
        this.useLocalCache = true;
      }
      return await this.searchCacheByScan(collectionName, query);
    }
  }

  async initializeCacheContainers(collections) {
    try {
      console.log("Initializing cache containers...");

      if (this.useLocalCache) {
        // Clear all cache on startup
        this.localCache.clear();
        this.localStats.clear();

        const collectionsToIgnore = ["commandlog"]; // for ram's sake

        // Initialize stats for each collection
        for (const collection of collections) {
          const collectionName = collection.name;
          if (collectionsToIgnore.includes(collectionName)) {
            continue;
          }

          // Initialize hit/miss counters if they don't exist
          const hitsKey = this.getLocalStatsKey(collectionName, "hits");
          const missesKey = this.getLocalStatsKey(collectionName, "misses");
          if (!this.localStats.has(hitsKey)) {
            this.localStats.set(hitsKey, 0);
          }
          if (!this.localStats.has(missesKey)) {
            this.localStats.set(missesKey, 0);
          }
        }
        console.log("* Cache containers initialized (local cache)");
        return;
      }

      try {
        await this.ensureRedisConnection();

        // Clear all cache on startup
        await this.clearCache();

        const collectionsToIgnore = ["commandlog"]; // for ram's sake

        // Initialize stats for each collection
        for (const collection of collections) {
          const collectionName = collection.name;
          if (collectionsToIgnore.includes(collectionName)) {
            continue;
          }

          // Initialize hit/miss counters if they don't exist
          const hitsKey = this.getStatsKey(collectionName, "hits");
          const missesKey = this.getStatsKey(collectionName, "misses");
          await this.redisClient.setNX(hitsKey, "0");
          await this.redisClient.setNX(missesKey, "0");
        }
        console.log("* Cache containers initialized");
      } catch {
        // Fallback to local cache
        console.log(
          "* Redis unavailable during initialization, using local cache"
        );
        if (global.fb?.discord?.importantLog) {
          global.fb.discord.importantLog(
            "* Redis connection unavailable, using local in-memory cache"
          );
        }
        this.useLocalCache = true;
        await this.initializeCacheContainers(collections); // Recursive call
      }
    } catch (err) {
      console.error("Failed to initialize cache containers:", err);
    }
  }

  async clearCache(collectionName = null) {
    if (this.useLocalCache) {
      if (collectionName) {
        const prefix = `cache:${collectionName}:`;
        for (const key of this.localCache.keys()) {
          if (key.startsWith(prefix)) {
            this.localCache.delete(key);
          }
        }
        // Also clear stats
        this.localStats.delete(this.getLocalStatsKey(collectionName, "hits"));
        this.localStats.delete(this.getLocalStatsKey(collectionName, "misses"));
        console.log(`Cleared cache for collection: ${collectionName}`);
      } else {
        // Clear all caches
        this.localCache.clear();
        this.localStats.clear();
        console.log("Cleared all caches");
      }
      return;
    }

    try {
      await this.ensureRedisConnection();
      if (collectionName) {
        const pattern = `cache:${collectionName}:*`;
        const keys = await this.redisClient.keys(pattern);
        if (keys.length > 0) {
          await this.redisClient.del(keys);
        }
        // Also clear stats
        await this.redisClient.del(
          this.getStatsKey(collectionName, "hits"),
          this.getStatsKey(collectionName, "misses")
        );
        console.log(`Cleared cache for collection: ${collectionName}`);
      } else {
        // Clear all caches
        const pattern = "cache:*";
        const keys = await this.redisClient.keys(pattern);
        if (keys.length > 0) {
          await this.redisClient.del(keys);
        }
        // Clear all stats
        const statsPattern = "stats:*";
        const statsKeys = await this.redisClient.keys(statsPattern);
        if (statsKeys.length > 0) {
          await this.redisClient.del(statsKeys);
        }
        console.log("Cleared all caches");
      }
    } catch {
      // Fallback to local cache on error
      if (!this.useLocalCache) {
        this.useLocalCache = true;
      }
      await this.clearCache(collectionName); // Recursive call
    }
  }

  async getCacheStats(collectionName = null, collections = []) {
    if (this.useLocalCache) {
      if (collectionName) {
        const size = await this.getCacheSize(collectionName);
        const hits = await this.getStat(collectionName, "hits");
        const misses = await this.getStat(collectionName, "misses");
        return {
          collection: collectionName,
          size: size,
          max: null,
          ttl: this.cacheTTL,
          hits: hits,
          misses: misses,
        };
      } else {
        // Return stats for all collections
        const stats = {};

        for (const collection of collections) {
          const collectionName = collection.name;
          const size = await this.getCacheSize(collectionName);
          const hits = await this.getStat(collectionName, "hits");
          const misses = await this.getStat(collectionName, "misses");
          stats[collectionName] = {
            size: size,
            max: null,
            ttl: this.cacheTTL,
            hits: hits,
            misses: misses,
          };
        }
        return stats;
      }
    }

    try {
      await this.ensureRedisConnection();
      if (collectionName) {
        const size = await this.getCacheSize(collectionName);
        const hits = await this.getStat(collectionName, "hits");
        const misses = await this.getStat(collectionName, "misses");
        return {
          collection: collectionName,
          size: size,
          max: null, // Redis doesn't have a max like LRU cache
          ttl: this.cacheTTL,
          hits: hits,
          misses: misses,
        };
      } else {
        // Return stats for all collections
        const stats = {};

        for (const collection of collections) {
          const collectionName = collection.name;
          const size = await this.getCacheSize(collectionName);
          const hits = await this.getStat(collectionName, "hits");
          const misses = await this.getStat(collectionName, "misses");
          stats[collectionName] = {
            size: size,
            max: null,
            ttl: this.cacheTTL,
            hits: hits,
            misses: misses,
          };
        }
        return stats;
      }
    } catch {
      // Fallback to local cache on error
      if (!this.useLocalCache) {
        this.useLocalCache = true;
      }
      return await this.getCacheStats(collectionName, collections); // Recursive call
    }
  }

  // Method to check if a document is cached
  async isCached(collectionName, documentId) {
    if (this.useLocalCache) {
      const key = this.getLocalCacheKey(collectionName, documentId);
      const entry = this.localCache.get(key);
      if (entry) {
        // Check if expired
        if (entry.expiresAt && entry.expiresAt < Date.now()) {
          this.localCache.delete(key);
          return false;
        }
        return true;
      }
      return false;
    }

    try {
      await this.ensureRedisConnection();
      const key = this.getCacheKey(collectionName, documentId);
      const exists = await this.redisClient.exists(key);
      return exists === 1;
    } catch {
      // Fallback to local cache on error
      if (!this.useLocalCache) {
        this.useLocalCache = true;
      }
      return await this.isCached(collectionName, documentId); // Recursive call
    }
  }

  // Method to get cache hit ratio
  async getCacheHitRatio(collectionName = null, collections = []) {
    if (collectionName) {
      const hits = await this.getStat(collectionName, "hits");
      const misses = await this.getStat(collectionName, "misses");
      const total = hits + misses;
      return total > 0 ? ((hits / total) * 100).toFixed(2) + "%" : "0%";
    } else {
      // Calculate overall hit ratio
      let totalHits = 0;
      let totalMisses = 0;

      for (const collection of collections) {
        const collectionName = collection.name;
        totalHits += await this.getStat(collectionName, "hits");
        totalMisses += await this.getStat(collectionName, "misses");
      }

      const total = totalHits + totalMisses;
      return total > 0 ? ((totalHits / total) * 100).toFixed(2) + "%" : "0%";
    }
  }
}

module.exports = RedisClient;
