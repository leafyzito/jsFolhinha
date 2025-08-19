const { MongoClient } = require("mongodb");
const { LRUCache } = require("lru-cache");

const mongoUri = process.env.MONGO_URI;
const clientMongo = new MongoClient(mongoUri);
const db = clientMongo.db("folhinha");

class MongoUtils {
  constructor() {
    this.client = clientMongo;
    this.db = db;

    // Initialize LRU cache for each collection
    this.collectionCaches = new Map();
    this.cacheOptions = {
      max: 500000, // Maximum number of items
      ttl: 24 * 60 * 60 * 1000, // 24 hour TTL
      updateAgeOnGet: true,
    };

    // Initialize cache containers without loading data
    this.initializeCacheContainers();
  }

  async initializeCacheContainers() {
    try {
      console.log("Initializing cache containers...");
      await this.client.connect();
      const collections = await this.db.listCollections().toArray();

      const collectionsToIgnore = ["commandlog"]; // for ram's sake

      for (const collection of collections) {
        const collectionName = collection.name;
        if (collectionsToIgnore.includes(collectionName)) {
          continue;
        }

        // Create empty cache container for each collection
        const cache = new LRUCache(this.cacheOptions);
        this.collectionCaches.set(collectionName, cache);
      }
      console.log("* Cache containers initialized");
    } catch (err) {
      console.error("Failed to initialize cache containers:", err);
    }
  }

  async insert(collectionName, data) {
    // Insert into DB first to get _id
    await this.client.connect();
    const collection = this.db.collection(collectionName);
    const result = await collection.insertOne(data);

    // Add _id to data object
    const dataWithId = { ...data, _id: result.insertedId };

    // Update cache with document containing _id
    const cache = this.getCollectionCache(collectionName);
    cache.set(JSON.stringify(result.insertedId), dataWithId);
  }

  async get(collectionName, query, forceDb = false) {
    const cache = this.getCollectionCache(collectionName);

    if (!forceDb) {
      // Search cache for matching documents
      const matches = [];
      for (const [, doc] of cache.entries()) {
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

      if (matches.length > 0) {
        // Return single item directly if only one result, otherwise return array
        return matches.length === 1 ? matches[0] : matches;
      }

      // If not in cache, fetch from DB and update cache (lazy loading)
      return await this.fetchFromDbAndCache(collectionName, query);
    }

    // If forceDb=true, fetch from DB and update cache
    return await this.fetchFromDbAndCache(collectionName, query);
  }

  async fetchFromDbAndCache(collectionName, query) {
    try {
      await this.client.connect();
      const collection = this.db.collection(collectionName);
      const results = await collection.find(query).toArray();

      // Cache each document using its _id as key
      const cache = this.getCollectionCache(collectionName);
      results.forEach((doc) => {
        cache.set(JSON.stringify(doc._id), doc);
      });

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
      await this.client.connect();
      const collection = this.db.collection(collectionName);
      currentDoc = await collection.findOne(query);
    }

    // Calculate updated document
    const doc = currentDoc;
    const updatedDoc = { ...doc };
    if (update.$set) {
      Object.assign(updatedDoc, update.$set);
    }
    if (update.$inc) {
      for (const [key, value] of Object.entries(update.$inc)) {
        updatedDoc[key] = (updatedDoc[key] || 0) + value;
      }
    }

    // Update DB asynchronously
    this.client.connect().then(() => {
      const collection = this.db.collection(collectionName);
      collection.updateOne(query, update).catch((err) => {
        console.error("Failed to update DB:", err);
        // Rollback cache on error
        this.getCollectionCache(collectionName).set(
          JSON.stringify(doc._id),
          doc
        );
      });
    });

    // Update cache immediately
    const cache = this.getCollectionCache(collectionName);
    cache.set(JSON.stringify(doc._id), updatedDoc);

    return updatedDoc;
  }

  async updateMany(collectionName, query, update) {
    // Get current documents from cache or DB
    let currentDocs = await this.get(collectionName, query);
    const cache = this.getCollectionCache(collectionName);

    // Handle case where get returns single item or null
    if (!currentDocs) {
      currentDocs = [];
    } else if (!Array.isArray(currentDocs)) {
      currentDocs = [currentDocs];
    }

    // Update cache immediately
    const updatedDocs = currentDocs.map((doc) => {
      const updatedDoc = { ...doc };
      if (update.$set) {
        Object.assign(updatedDoc, update.$set);
      }
      if (update.$inc) {
        for (const [key, value] of Object.entries(update.$inc)) {
          updatedDoc[key] = (updatedDoc[key] || 0) + value;
        }
      }
      cache.set(JSON.stringify(doc._id), updatedDoc);
      return updatedDoc;
    });

    // Update DB asynchronously
    this.client.connect().then(() => {
      const collection = this.db.collection(collectionName);
      collection.updateMany(query, update).catch((err) => {
        console.error("Failed to update DB:", err);
        // Rollback cache on error
        currentDocs.forEach((doc) => {
          cache.set(JSON.stringify(doc._id), doc);
        });
      });
    });

    return updatedDocs;
  }

  async delete(collectionName, query) {
    const docToDelete = await this.get(collectionName, query);
    if (!docToDelete) {
      return;
    }

    // Remove from cache immediately
    const cache = this.getCollectionCache(collectionName);
    cache.delete(JSON.stringify(docToDelete._id));

    // Delete from DB asynchronously
    this.client.connect().then(() => {
      const collection = this.db.collection(collectionName);
      collection.deleteOne(query).catch((err) => {
        console.error("Failed to delete from DB:", err);
        cache.set(JSON.stringify(docToDelete._id), docToDelete); // Rollback cache on error
      });
    });
  }

  async count(collectionName, query = {}, skipCache = false) {
    const cache = this.getCollectionCache(collectionName);

    if (skipCache) {
      await this.client.connect();
      const collection = this.db.collection(collectionName);
      return await collection.countDocuments(query);
    }

    // If no query, return cache size (only cached documents)
    if (!query || Object.keys(query).length === 0) {
      return cache.size;
    }

    // Check cache first
    let count = 0;
    for (const [, doc] of cache.entries()) {
      let isMatch = true;
      for (const [key, value] of Object.entries(query)) {
        if (doc[key] !== value) {
          isMatch = false;
          break;
        }
      }
      if (isMatch) {
        count++;
      }
    }

    // If we have cached results, return them
    if (count > 0 || cache.size > 0) {
      return count;
    }

    // If cache is empty and we have a query, fetch from DB
    // This ensures we get accurate counts even when cache is empty
    try {
      await this.client.connect();
      const collection = this.db.collection(collectionName);
      return await collection.countDocuments(query);
    } catch (err) {
      console.error(`Failed to count documents in ${collectionName}:`, err);
      return 0;
    }
  }

  getCollectionCache(collectionName) {
    let cache = this.collectionCaches.get(collectionName);
    if (!cache) {
      cache = new LRUCache(this.cacheOptions);
      this.collectionCaches.set(collectionName, cache);
    }
    return cache;
  }

  // Utility methods for cache management
  async preloadCollection(collectionName, query = {}) {
    try {
      console.log(`Preloading collection: ${collectionName}`);
      const results = await this.fetchFromDbAndCache(collectionName, query);
      console.log(
        `Preloaded ${
          this.getCollectionCache(collectionName).size
        } documents from ${collectionName}`
      );
      return results;
    } catch (err) {
      console.error(`Failed to preload collection ${collectionName}:`, err);
      return null;
    }
  }

  async preloadDocument(collectionName, documentId) {
    try {
      const cache = this.getCollectionCache(collectionName);
      const cacheKey = JSON.stringify(documentId);

      // Check if already in cache
      if (cache.has(cacheKey)) {
        return cache.get(cacheKey);
      }

      // Fetch specific document from DB
      await this.client.connect();
      const collection = this.db.collection(collectionName);
      const doc = await collection.findOne({ _id: documentId });

      if (doc) {
        cache.set(cacheKey, doc);
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

  clearCache(collectionName = null) {
    if (collectionName) {
      const cache = this.collectionCaches.get(collectionName);
      if (cache) {
        cache.clear();
        console.log(`Cleared cache for collection: ${collectionName}`);
      }
    } else {
      // Clear all caches
      for (const [, cache] of this.collectionCaches) {
        cache.clear();
      }
      console.log("Cleared all caches");
    }
  }

  getCacheStats(collectionName = null) {
    if (collectionName) {
      const cache = this.collectionCaches.get(collectionName);
      if (cache) {
        return {
          collection: collectionName,
          size: cache.size,
          max: cache.max,
          ttl: cache.ttl,
          hits: cache.hits,
          misses: cache.misses,
        };
      }
      return null;
    } else {
      // Return stats for all collections
      const stats = {};
      for (const [name, cache] of this.collectionCaches) {
        stats[name] = {
          size: cache.size,
          max: cache.max,
          ttl: cache.ttl,
          hits: cache.hits,
          misses: cache.misses,
        };
      }
      return stats;
    }
  }

  // Method to check if a document is cached
  isCached(collectionName, documentId) {
    const cache = this.getCollectionCache(collectionName);
    return cache.has(JSON.stringify(documentId));
  }

  // Method to get cache hit ratio
  getCacheHitRatio(collectionName = null) {
    if (collectionName) {
      const cache = this.collectionCaches.get(collectionName);
      if (cache && cache.hits !== undefined && cache.misses !== undefined) {
        const total = cache.hits + cache.misses;
        return total > 0 ? ((cache.hits / total) * 100).toFixed(2) + "%" : "0%";
      }
      return "N/A";
    } else {
      // Calculate overall hit ratio
      let totalHits = 0;
      let totalMisses = 0;

      for (const [, cache] of this.collectionCaches) {
        if (cache.hits !== undefined && cache.misses !== undefined) {
          totalHits += cache.hits;
          totalMisses += cache.misses;
        }
      }

      const total = totalHits + totalMisses;
      return total > 0 ? ((totalHits / total) * 100).toFixed(2) + "%" : "0%";
    }
  }
}

module.exports = MongoUtils;
