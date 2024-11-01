const { MongoClient } = require('mongodb');

const mongoUri = process.env.MONGO_URI;
const clientMongo = new MongoClient(mongoUri);
const db = clientMongo.db("folhinha");

class MongoUtils {
    constructor() {
        this.client = clientMongo;
        this.db = db;
        this.inMemoryDb = new Map(); // In-memory database storage
        this.initializeInMemoryDb();
    }

    async initializeInMemoryDb() {
        await this.client.connect();
        const collections = await this.db.listCollections().toArray();

        for (const collection of collections) {
            const collectionName = collection.name;
            const documents = await this.db.collection(collectionName).find({}).toArray();
            this.inMemoryDb.set(collectionName, new Map());

            for (const doc of documents) {
                this.inMemoryDb.get(collectionName).set(doc._id, doc);
            }
        }
    }

    async insert(collectionName, data) {
        await this.client.connect();
        const collection = this.db.collection(collectionName);
        const result = await collection.insertOne(data);

        // Update in-memory db
        if (!this.inMemoryDb.has(collectionName)) {
            this.inMemoryDb.set(collectionName, new Map());
        }
        this.inMemoryDb.get(collectionName).set(data._id, data);
    }

    async get(collectionName, query) {
        if (!this.inMemoryDb.has(collectionName)) {
            // get from db
            const docs = await this.db.collection(collectionName).find(query).toArray();
            this.inMemoryDb.set(collectionName, new Map());
            for (const doc of docs) {
                this.inMemoryDb.get(collectionName).set(doc._id, doc);
            }
        }

        const collectionMap = this.inMemoryDb.get(collectionName);
        return Array.from(collectionMap.values()).filter(doc => {
            return Object.entries(query).every(([key, value]) => doc[key] === value);
        });
    }

    async update(collectionName, query, update) {
        await this.client.connect();
        const collection = this.db.collection(collectionName);
        await collection.updateOne(query, update);

        // Update in-memory db
        const docs = await collection.find(query).toArray();
        if (docs.length > 0) {
            const doc = docs[0];
            this.inMemoryDb.get(collectionName).set(doc._id, doc);
        }
    }

    async updateMany(collectionName, query, update) {
        await this.client.connect();
        const collection = this.db.collection(collectionName);
        await collection.updateMany(query, update);

        // Update in-memory db
        const docs = await collection.find(query).toArray();
        for (const doc of docs) {
            this.inMemoryDb.get(collectionName).set(doc._id, doc);
        }
    }

    async delete(collectionName, query) {
        await this.client.connect();
        const collection = this.db.collection(collectionName);
        const docToDelete = await collection.findOne(query);
        await collection.deleteOne(query);

        // Update in-memory db
        if (docToDelete) {
            this.inMemoryDb.get(collectionName).delete(docToDelete._id);
        }
    }

    async count(collectionName, query) {
        if (!this.inMemoryDb.has(collectionName)) {
            return 0;
        }

        const collectionMap = this.inMemoryDb.get(collectionName);
        return Array.from(collectionMap.values()).filter(doc => {
            return Object.entries(query).every(([key, value]) => doc[key] === value);
        }).length;
    }
}

module.exports = {
    MongoUtils: MongoUtils,
};