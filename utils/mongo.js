const { MongoClient } = require('mongodb');

const mongoUri = process.env.MONGO_URI;
const clientMongo = new MongoClient(mongoUri);
const db = clientMongo.db("folhinha");

class MongoUtils {
    constructor() {
        this.client = clientMongo;
        this.db = db;
        this.cache = new Map(); // Cache storage
        this.cacheTimeout = 24 * 60 * 60 * 1000; // 24 hours cache
    }

    getCacheKey(collectionName, query) {
        return `${collectionName}-${JSON.stringify(query)}`;
    }

    setCache(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    getCache(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;

        if (Date.now() - cached.timestamp > this.cacheTimeout) {
            this.cache.delete(key);
            return null;
        }

        return cached.data;
    }

    invalidateCache(collectionName) {
        for (const key of this.cache.keys()) {
            if (key.startsWith(collectionName)) {
                this.cache.delete(key);
            }
        }
    }

    async insert(collectionName, data) {
        await this.client.connect();
        const collection = this.db.collection(collectionName);
        await collection.insertOne(data);
        this.invalidateCache(collectionName);
    }

    async get(collectionName, query) {
        const cacheKey = this.getCacheKey(collectionName, query);
        const cached = this.getCache(cacheKey);
        if (cached) return cached;

        await this.client.connect();
        const collection = this.db.collection(collectionName);
        const result = await collection.find(query).toArray().then((result, err) => {
            if (err) {
                console.log(err);
                return;
            }
            return result;
        });

        if (result) {
            this.setCache(cacheKey, result);
        }
        return result;
    }

    async update(collectionName, query, update) {
        await this.client.connect();
        const collection = this.db.collection(collectionName);
        await collection.updateOne(query, update);

        // Get updated document and update cache
        const updatedDoc = await collection.find(query).toArray();
        const cacheKey = this.getCacheKey(collectionName, query);
        if (updatedDoc.length > 0) {
            this.setCache(cacheKey, updatedDoc);
        }
    }

    async updateMany(collectionName, query, update) {
        await this.client.connect();
        const collection = this.db.collection(collectionName);
        await collection.updateMany(query, update);

        // Get updated documents and update cache
        const updatedDocs = await collection.find(query).toArray();
        const cacheKey = this.getCacheKey(collectionName, query);
        if (updatedDocs.length > 0) {
            this.setCache(cacheKey, updatedDocs);
        }
    }

    async delete(collectionName, query) {
        await this.client.connect();
        const collection = this.db.collection(collectionName);
        await collection.deleteOne(query);
        this.invalidateCache(collectionName);
    }

    async count(collectionName, query) {
        const cacheKey = this.getCacheKey(collectionName + '-count', query);
        const cached = this.getCache(cacheKey);
        if (cached !== null) return cached;

        await this.client.connect();
        const collection = this.db.collection(collectionName);
        const count = await collection.countDocuments(query);

        this.setCache(cacheKey, count);
        return count;
    }
}

module.exports = {
    MongoUtils: MongoUtils,
};