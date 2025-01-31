require('dotenv').config();
const { MongoClient } = require('mongodb');
const mongoUri = process.env.MONGO_URI;
const clientMongo = new MongoClient(mongoUri);
const db = clientMongo.db("folhinha");

const users = [];
const duppedUsers = [];

// Wrapping the MongoDB operations in an async function
async function main() {
    try {
        await clientMongo.connect();
        const teste = await db.collection('users').find({}).toArray();
        // console.log(teste);
        console.log(teste.length);

        for (const user of teste) {
            const userId = user.userid;

            if (users.includes(userId)) {
                duppedUsers.push(userId);
            } else {
                users.push(userId);
            }
        }

        console.log(duppedUsers);

        // for each dupped user, get all registries in 'users' table, get the message count (msgCount.total) and keep the highest one deleting all others
        for (const userId of duppedUsers) {
            const registries = await db.collection('users').find({ userid: userId }).toArray();
            const highestRegistry = registries.reduce((highest, current) => {
                return highest.msgCount.total > current.msgCount.total ? highest : current;
            });
            console.log(`deleting ${registries.length - 1} registries for user ${userId} (keeping id: ${highestRegistry._id})`);
            await db.collection('users').deleteMany({ userid: userId, _id: { $ne: highestRegistry._id } });
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await clientMongo.close();
    }
}

// Execute the function
main();

