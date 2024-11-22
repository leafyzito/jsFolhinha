const { MongoClient } = require('mongodb');
const { LRUCache } = require('lru-cache');

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
        this.loadDbCache();
    }

    async loadDbCache() {
        try {
            await this.client.connect();
            const collections = await this.db.listCollections().toArray();

            const collectionsToIgnore = ['commandlog']; // for ram's sake

            for (const collection of collections) {
                const collectionName = collection.name;
                if (collectionsToIgnore.includes(collectionName)) continue;
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
        }

        // If not in cache or forceDb=true, fetch from DB and update cache
        await this.client.connect();
        const collection = this.db.collection(collectionName);
        const results = await collection.find(query).toArray();

        results.forEach(doc => {
            cache.set(JSON.stringify(doc._id), doc);
        });

        return results;
    }

    async update(collectionName, query, update) {
        // Get current document from cache or DB
        let currentDoc = await this.get(collectionName, query);
        if (!currentDoc || currentDoc.length === 0) {
            // if not in cache, fetch from DB
            await this.client.connect();
            const collection = this.db.collection(collectionName);
            currentDoc = await collection.findOne(query);
        }

        // Calculate updated document
        const doc = currentDoc[0];
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
            collection.updateOne(query, update).catch(err => {
                console.error('Failed to update DB:', err);
                cache.set(JSON.stringify(doc._id), doc); // Rollback cache on error
            });
        });

        // Update cache immediately
        const cache = this.getCollectionCache(collectionName);
        cache.set(JSON.stringify(doc._id), updatedDoc);

        return updatedDoc;
    }

    async updateMany(collectionName, query, update) {
        // Get current documents from cache or DB
        const currentDocs = await this.get(collectionName, query);
        const cache = this.getCollectionCache(collectionName);

        // Update cache immediately
        const updatedDocs = currentDocs.map(doc => {
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
            collection.updateMany(query, update).catch(err => {
                console.error('Failed to update DB:', err);
                // Rollback cache on error
                currentDocs.forEach(doc => {
                    cache.set(JSON.stringify(doc._id), doc);
                });
            });
        });

        return updatedDocs;
    }

    async delete(collectionName, query) {
        const docToDelete = await this.get(collectionName, query);
        if (!docToDelete || docToDelete.length === 0) return;

        // Remove from cache immediately
        const cache = this.getCollectionCache(collectionName);
        cache.delete(JSON.stringify(docToDelete[0]._id));

        // Delete from DB asynchronously
        this.client.connect().then(() => {
            const collection = this.db.collection(collectionName);
            collection.deleteOne(query).catch(err => {
                console.error('Failed to delete from DB:', err);
                cache.set(JSON.stringify(docToDelete[0]._id), docToDelete[0]); // Rollback cache on error
            });
        });
    }

    async count(collectionName, query = {}) {
        const cache = this.getCollectionCache(collectionName);

        if (!query || Object.keys(query).length === 0) {
            return cache.size;
        }

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