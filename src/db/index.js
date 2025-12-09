const { MongoClient } = require("mongodb");
const { createClient } = require("redis");

const mongoUri = process.env.MONGO_URI;
const clientMongo = new MongoClient(mongoUri);
const db = clientMongo.db("folhinha");

const redisHost = process.env.REDIS_HOST || "localhost";
const redisPort = process.env.REDIS_PORT || "6379";

class MongoUtils {
  constructor() {
    this.client = clientMongo;
    this.db = db;
    this.isConnected = false;
    this.redisConnecting = false;

    // Initialize Redis client with fallback to localhost
    this.redisClient = this.createRedisClient(
      redisHost,
      parseInt(redisPort, 10)
    );
    this.redisHost = redisHost;
    this.redisPort = parseInt(redisPort, 10);

    // Cache TTL: 24 hours in seconds
    this.cacheTTL = 24 * 60 * 60;

    // Initialize cache containers
    this.initializeCacheContainers();
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
          this.redisHost = "localhost";
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

  async ensureConnection() {
    if (!this.isConnected) {
      await this.client.connect();
      this.isConnected = true;
    }
  }

  async ensureRedisConnection() {
    if (!this.redisClient.isOpen) {
      await this.redisClient.connect();
    }
  }

  async initializeCacheContainers() {
    try {
      console.log("Initializing cache containers...");
      await this.ensureRedisConnection();
      await this.ensureConnection();
      const collections = await this.db.listCollections().toArray();

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
    } catch (err) {
      console.error("Failed to initialize cache containers:", err);
    }
  }

  getCacheKey(collectionName, documentId) {
    return `cache:${collectionName}:${JSON.stringify(documentId)}`;
  }

  getStatsKey(collectionName, statType) {
    return `stats:${collectionName}:${statType}`;
  }

  async incrementStat(collectionName, statType) {
    await this.ensureRedisConnection();
    const key = this.getStatsKey(collectionName, statType);
    await this.redisClient.incr(key);
  }

  async getStat(collectionName, statType) {
    await this.ensureRedisConnection();
    const key = this.getStatsKey(collectionName, statType);
    const value = await this.redisClient.get(key);
    return value ? parseInt(value, 10) : 0;
  }

  async insert(collectionName, data) {
    // Insert into DB first to get _id
    await this.ensureConnection();
    const collection = this.db.collection(collectionName);
    const result = await collection.insertOne(data);

    // Add _id to data object
    const dataWithId = { ...data, _id: result.insertedId };

    // Update cache with document containing _id
    await this.setCache(collectionName, result.insertedId, dataWithId);

    // Return the result so we can access insertedId
    return result;
  }

  async setCache(collectionName, documentId, document) {
    await this.ensureRedisConnection();
    const key = this.getCacheKey(collectionName, documentId);
    await this.redisClient.setEx(key, this.cacheTTL, JSON.stringify(document));
  }

  async getCache(collectionName, documentId) {
    await this.ensureRedisConnection();
    const key = this.getCacheKey(collectionName, documentId);
    const value = await this.redisClient.get(key);
    if (value) {
      return JSON.parse(value);
    }
    return null;
  }

  async deleteCache(collectionName, documentId) {
    await this.ensureRedisConnection();
    const key = this.getCacheKey(collectionName, documentId);
    await this.redisClient.del(key);
  }

  async get(collectionName, query, forceDb = false) {
    if (!forceDb) {
      // Search cache for matching documents
      const matches = await this.searchCache(collectionName, query);

      if (matches.length > 0) {
        await this.incrementStat(collectionName, "hits");
        return matches.length === 1 ? matches[0] : matches;
      }

      // Manually track cache miss
      await this.incrementStat(collectionName, "misses");
      // If not in cache, fetch from DB and update cache (lazy loading)
      return await this.fetchFromDbAndCache(collectionName, query);
    }

    // If forceDb=true, fetch from DB and update cache
    return await this.fetchFromDbAndCache(collectionName, query);
  }

  async fetchFromDbAndCache(collectionName, query) {
    try {
      await this.ensureConnection();
      const collection = this.db.collection(collectionName);
      const results = await collection.find(query).toArray();

      // Cache each document using its _id as key
      for (const doc of results) {
        await this.setCache(collectionName, doc._id, doc);
      }

      // Return single item directly if only one result, otherwise return array
      // Return null if no results found
      if (results.length === 0) {
        return null;
      }
      return results.length === 1 ? results[0] : results;
    } catch (err) {
      console.error(
        `Failed to fetch from DB for collection ${collectionName}:`,
        err
      );
      return null;
    }
  }

  async update(collectionName, query, update) {
    // Get current document from cache or DB
    let currentDoc = await this.get(collectionName, query);
    if (!currentDoc) {
      // if not in cache, fetch from DB
      await this.ensureConnection();
      const collection = this.db.collection(collectionName);
      currentDoc = await collection.findOne(query);
    }

    // Update DB first to get the actual updated document
    await this.ensureConnection();
    const collection = this.db.collection(collectionName);

    // Apply the update to DB
    await collection.updateOne(query, update);

    // Fetch the updated document from DB to ensure cache has correct data
    const updatedDoc = await collection.findOne(query);

    if (updatedDoc) {
      // Update cache with the actual updated document from DB
      await this.setCache(collectionName, updatedDoc._id, updatedDoc);
      return updatedDoc;
    }

    return currentDoc;
  }

  async updateMany(collectionName, query, update) {
    // Get current documents from cache or DB
    let currentDocs = await this.get(collectionName, query);

    // Handle case where get returns single item or null
    if (!currentDocs) {
      currentDocs = [];
    } else if (!Array.isArray(currentDocs)) {
      currentDocs = [currentDocs];
    }

    // Update DB first to get the actual updated documents
    await this.ensureConnection();
    const collection = this.db.collection(collectionName);

    // Apply the update to DB
    await collection.updateMany(query, update);

    // Fetch the updated documents from DB to ensure cache has correct data
    const updatedDocs = await collection.find(query).toArray();

    if (updatedDocs.length > 0) {
      // Update cache with the actual updated documents from DB
      for (const doc of updatedDocs) {
        await this.setCache(collectionName, doc._id, doc);
      }
      return updatedDocs;
    }

    return currentDocs;
  }

  async delete(collectionName, query) {
    const docToDelete = await this.get(collectionName, query);
    if (!docToDelete) {
      return;
    }

    // Remove from cache immediately
    await this.deleteCache(collectionName, docToDelete._id);

    // Delete from DB asynchronously
    this.ensureConnection().then(() => {
      const collection = this.db.collection(collectionName);
      collection.deleteOne(query).catch(async (err) => {
        console.error("Failed to delete from DB:", err);
        // Rollback cache on error
        await this.setCache(collectionName, docToDelete._id, docToDelete);
      });
    });
  }

  async count(collectionName, query = {}, skipCache = false) {
    if (skipCache) {
      await this.ensureConnection();
      const collection = this.db.collection(collectionName);
      return await collection.countDocuments(query);
    }

    // If no query, return cache size (only cached documents)
    if (!query || Object.keys(query).length === 0) {
      return await this.getCacheSize(collectionName);
    }

    // Check cache first using the helper function
    const matches = await this.searchCache(collectionName, query);
    const count = matches.length;

    // If we have cached results, return them
    if (count > 0) {
      return count;
    }

    // If cache is empty and we have a query, fetch from DB
    // This ensures we get accurate counts even when cache is empty
    try {
      await this.ensureConnection();
      const collection = this.db.collection(collectionName);
      return await collection.countDocuments(query);
    } catch (err) {
      console.error(`Failed to count documents in ${collectionName}:`, err);
      return 0;
    }
  }

  async getCacheSize(collectionName) {
    await this.ensureRedisConnection();
    const pattern = `cache:${collectionName}:*`;
    const keys = await this.redisClient.keys(pattern);
    return keys.length;
  }

  async aggregate(collectionName, pipeline) {
    await this.ensureConnection();
    const collection = this.db.collection(collectionName);
    try {
      const results = await collection.aggregate(pipeline).toArray();
      return results;
    } catch (err) {
      console.error(`Failed to aggregate documents in ${collectionName}:`, err);
      return [];
    }
  }

  async searchCache(collectionName, query) {
    await this.ensureRedisConnection();
    const queryKeys = Object.keys(query);
    const matches = [];

    // For single field queries, try direct cache lookup first
    if (queryKeys.length === 1) {
      const key = queryKeys[0];
      const value = query[key];

      // If querying by _id, use direct cache lookup
      if (key === "_id") {
        const doc = await this.getCache(collectionName, value);
        if (doc) {
          return [doc];
        }
        return [];
      }

      // For other single field queries, search all cached documents
      const pattern = `cache:${collectionName}:*`;
      const keys = await this.redisClient.keys(pattern);

      for (const cacheKey of keys) {
        const docStr = await this.redisClient.get(cacheKey);
        if (docStr) {
          try {
            const doc = JSON.parse(docStr);
            if (doc[key] === value) {
              matches.push(doc);
            }
          } catch {
            // Skip invalid JSON
            continue;
          }
        }
      }
      return matches;
    } else {
      // For multi-field queries, search all cached documents
      const pattern = `cache:${collectionName}:*`;
      const keys = await this.redisClient.keys(pattern);

      for (const cacheKey of keys) {
        const docStr = await this.redisClient.get(cacheKey);
        if (docStr) {
          try {
            const doc = JSON.parse(docStr);
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
      return matches;
    }
  }

  // Utility methods for cache management
  async preloadCollection(collectionName, query = {}) {
    try {
      console.log(`Preloading collection: ${collectionName}`);
      const results = await this.fetchFromDbAndCache(collectionName, query);
      const size = await this.getCacheSize(collectionName);
      console.log(`Preloaded ${size} documents from ${collectionName}`);
      return results;
    } catch (err) {
      console.error(`Failed to preload collection ${collectionName}:`, err);
      return null;
    }
  }

  async preloadDocument(collectionName, documentId) {
    try {
      // Check if already in cache
      const cached = await this.getCache(collectionName, documentId);
      if (cached) {
        return cached;
      }

      // Fetch specific document from DB
      await this.ensureConnection();
      const collection = this.db.collection(collectionName);
      const doc = await collection.findOne({ _id: documentId });

      if (doc) {
        await this.setCache(collectionName, documentId, doc);
        return doc;
      }

      return null;
    } catch (err) {
      console.error(
        `Failed to preload document ${documentId} from ${collectionName}:`,
        err
      );
      return null;
    }
  }

  async clearCache(collectionName = null) {
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
  }

  async getCacheStats(collectionName = null) {
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
      await this.ensureConnection();
      const collections = await this.db.listCollections().toArray();

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

  // Method to check if a document is cached
  async isCached(collectionName, documentId) {
    await this.ensureRedisConnection();
    const key = this.getCacheKey(collectionName, documentId);
    const exists = await this.redisClient.exists(key);
    return exists === 1;
  }

  // Method to get cache hit ratio
  async getCacheHitRatio(collectionName = null) {
    if (collectionName) {
      const hits = await this.getStat(collectionName, "hits");
      const misses = await this.getStat(collectionName, "misses");
      const total = hits + misses;
      return total > 0 ? ((hits / total) * 100).toFixed(2) + "%" : "0%";
    } else {
      // Calculate overall hit ratio
      let totalHits = 0;
      let totalMisses = 0;

      await this.ensureConnection();
      const collections = await this.db.listCollections().toArray();

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

module.exports = MongoUtils;
