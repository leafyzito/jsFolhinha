const { MongoClient } = require('mongodb');
const { LRUCache } = require('lru-cache'); // Update the import

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
            max: 50000, // Maximum number of items
            ttl: 24 * 60 * 60 * 1000, // 24 hour TTL
            updateAgeOnGet: true
        };

        // Load initial data
        this.initializeCache();
    }

    async initializeCache() {
        try {
            await this.client.connect();
            const collections = await this.db.listCollections().toArray();

            for (const collection of collections) {
                const collectionName = collection.name;
                const cache = new LRUCache(this.cacheOptions);

                // Load all documents from collection
                const docs = await this.db.collection(collectionName).find({}).toArray();

                // Cache each document using its _id as key
                docs.forEach(doc => {
                    cache.set(JSON.stringify(doc._id), doc);
                });

                this.collectionCaches.set(collectionName, cache);
            }
        } catch (err) {
            console.error('Failed to initialize cache:', err);
        }
    }

    async insert(collectionName, data) {
        await this.client.connect();
        const collection = this.db.collection(collectionName);
        const result = await collection.insertOne(data);

        // Update cache
        const cache = this.getCollectionCache(collectionName);
        cache.set(JSON.stringify(data._id), data);
    }

    async get(collectionName, query) {
        const cache = this.getCollectionCache(collectionName);

        // Search cache for matching documents
        const matches = [];
        for (const [_, doc] of cache.entries()) {
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
            return matches;
        }

        // If not in cache, fetch from DB and update cache
        await this.client.connect();
        const collection = this.db.collection(collectionName);
        const results = await collection.find(query).toArray();

        results.forEach(doc => {
            cache.set(JSON.stringify(doc._id), doc);
        });

        return results;
    }

    async update(collectionName, query, update) {
        await this.client.connect();
        const collection = this.db.collection(collectionName);
        await collection.updateOne(query, update);

        // Update cache
        const updatedDoc = await collection.findOne(query);
        if (updatedDoc) {
            const cache = this.getCollectionCache(collectionName);
            cache.set(JSON.stringify(updatedDoc._id), updatedDoc);
        }
    }

    async updateMany(collectionName, query, update) {
        await this.client.connect();
        const collection = this.db.collection(collectionName);
        await collection.updateMany(query, update);

        // Update cache with all modified documents
        const updatedDocs = await collection.find(query).toArray();
        const cache = this.getCollectionCache(collectionName);
        updatedDocs.forEach(doc => {
            cache.set(JSON.stringify(doc._id), doc);
        });
    }

    async delete(collectionName, query) {
        await this.client.connect();
        const collection = this.db.collection(collectionName);

        // Find document before deletion to remove from cache
        const docToDelete = await collection.findOne(query);
        await collection.deleteOne(query);

        if (docToDelete) {
            const cache = this.getCollectionCache(collectionName);
            cache.delete(JSON.stringify(docToDelete._id));
        }
    }

    async count(collectionName, query = {}) {
        const cache = this.getCollectionCache(collectionName);

        if (!query || Object.keys(query).length === 0) {
            // If no query, return total count from cache
            return cache.size;
        }

        // Count matching documents in cache
        let count = 0;
        for (const [_, doc] of cache.entries()) {
            let isMatch = true;
            for (const [key, value] of Object.entries(query)) {
                if (doc[key] !== value) {
                    isMatch = false;
                    break;
                }
            }
            if (isMatch) count++;
        }

        return count;
    }

    getCollectionCache(collectionName) {
        let cache = this.collectionCaches.get(collectionName);
        if (!cache) {
            cache = new LRUCache(this.cacheOptions);
            this.collectionCaches.set(collectionName, cache);
        }
        return cache;
    }
}

module.exports = {
    MongoUtils: MongoUtils,
};