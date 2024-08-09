require('dotenv').config();
const fetch = require('node-fetch');

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
    var teste = await getUserByUserIDMany(['120209265', '467739611']);
    console.log(teste);
}

main(); // Call the main function
