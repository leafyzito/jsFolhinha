require('dotenv').config();
const { MongoClient } = require('mongodb');
const readline = require('readline');
const mongoUri = process.env.MONGO_URI;
const clientMongo = new MongoClient(mongoUri);
const db = clientMongo.db("folhinha");

const processedUsers = [];
const duppedUsers = [];

// Create readline interface
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Promise-based function to ask for confirmation
function askForConfirmation() {
    return new Promise((resolve) => {
        rl.question('Press Enter to proceed with deletion, or type "no" to cancel: ', (answer) => {
            resolve(answer.toLowerCase() !== 'no');
        });
    });
}

// Wrapping the MongoDB operations in an async function
async function main() {
    try {
        await clientMongo.connect();
        const users = await db.collection('users').find({}).toArray();
        console.log(users.length);

        for (const user of users) {
            const userId = user.userid;

            if (processedUsers.includes(userId)) {
                duppedUsers.push(userId);
            } else {
                processedUsers.push(userId);
            }
        }

        console.log('Duplicated users found:', duppedUsers);

        if (duppedUsers.length === 0) {
            console.log('No duplicated users found. Exiting...');
            return;
        }

        // Show what will be deleted
        for (const userId of duppedUsers) {
            const registries = await db.collection('users').find({ userid: userId }).toArray();
            const highestRegistry = registries.reduce((highest, current) => {
                return highest.msgCount.total > current.msgCount.total ? highest : current;
            });
            console.log(`Will delete ${registries.length - 1} registries for user ${userId} (keeping id: ${highestRegistry._id})`);
        }

        // Ask for confirmation
        const confirmed = await askForConfirmation();

        if (confirmed) {
            // Proceed with deletion
            for (const userId of duppedUsers) {
                const registries = await db.collection('users').find({ userid: userId }).toArray();
                const highestRegistry = registries.reduce((highest, current) => {
                    return highest.msgCount.total > current.msgCount.total ? highest : current;
                });
                console.log(`Deleting ${registries.length - 1} registries for user ${userId} (keeping id: ${highestRegistry._id})`);
                await db.collection('users').deleteMany({ userid: userId, _id: { $ne: highestRegistry._id } });
            }
            console.log('Deletion completed successfully.');
        } else {
            console.log('Operation cancelled by user.');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        rl.close();
        await clientMongo.close();
    }
}

// Execute the function
main();

