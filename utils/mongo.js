const { MongoClient } = require('mongodb');

const mongoUri = "mongodb+srv://folhinhabot:rafc123963@folhinha.oz5onxd.mongodb.net/?retryWrites=true&w=majority";
const clientMongo = new MongoClient(mongoUri);
const db = clientMongo.db("folhinha");

// create class with diverse commands like get, insert, update, delete
class MongoUtils {
    constructor() {
        this.client = clientMongo;
        this.db = db;
    }

    async insert(collectionName, data) {
        await this.client.connect();
        const collection = this.db.collection(collectionName);
        await collection.insertOne(data);
    }

    async get(collectionName, query) {
        await this.client.connect();
        const collection = this.db.collection(collectionName);
        return await collection.find(query).toArray().then((result, err) => {
            if (err) {
                console.log(err);
                return;
            }
            return result;
        });

    }

    async update(collectionName, query, update) {
        await this.client.connect();
        const collection = this.db.collection(collectionName);
        await collection.updateOne(query, update);
    }

    async delete(collectionName, query) {
        await this.client.connect();
        const collection = this.db.collection(collectionName);
        await collection.deleteOne(query);
    }
}

module.exports = {
    MongoUtils: MongoUtils,
};