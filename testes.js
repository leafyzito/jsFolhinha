require('dotenv').config();
const fs = require('fs');
const fetch = require('node-fetch');

// Load the channels to join from the channels.txt
const channelsFile = fs.readFileSync('channels.txt', 'utf-8');
const channelsLines = channelsFile.split('\n');
const channelIds = [];
channelsLines.forEach((line) => {
    const cId = line.split(' ')[0];
    if (cId) {
        channelIds.push(cId.replace('\r', ''));
    }
});

async function getUserByUserIDMany(userIds) {
    // Construct API URL

    var userIdsToUrl = userIds.join('&id=');

    const api_url = `https://api.twitch.tv/helix/users?id=${userIdsToUrl}`;
    // Set headers with API credentials
    const headers = { "Client-ID": process.env.BOT_CLIENT_ID, "Authorization": `Bearer ${process.env.BOT_OAUTH_TOKEN}` };
    // Make API request to fetch clips
    const response = await fetch(api_url, { headers });
    const data = await response.json();

    console.log(data);
        
    if (data.data.length === 0) { return null; }

    var listOfUsers = [];
    data.data.forEach((user) => {
        listOfUsers.push(user.login);
    });

    // console.log(listOfUsers);
    return listOfUsers;
}

async function main() {
    var teste = await getUserByUserIDMany(channelIds);
    console.log(teste);
}

main(); // Call the main function
