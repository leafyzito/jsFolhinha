const fetch = require('node-fetch');
const { MongoUtils } = require('./mongo.js');
const { Logger } = require('./log.js');

var channelPrefixes = {};

async function modifyClient(client) {
    client.getUserID = async function (username) {
        // Construct API URL
        const api_url = `https://api.twitch.tv/helix/users?login=${username}`;
        // Set headers with API credentials
        const headers = { "Client-ID": process.env.BOT_CLIENT_ID, "Authorization": `Bearer ${process.env.BOT_OAUTH_TOKEN}` };
        // Make API request to fetch clips
        const response = await fetch(api_url, { headers });
        const data = await response.json();
        
        if (data.data.length === 0) { return null; }
        return data.data[0].id;
    }
    
    client.getUserByUserID = async function (userId) {
        // Construct API URL
        const api_url = `https://api.twitch.tv/helix/users?id=${userId}`;
        // Set headers with API credentials
        const headers = { "Client-ID": process.env.BOT_CLIENT_ID, "Authorization": `Bearer ${process.env.BOT_OAUTH_TOKEN}` };
        // Make API request to fetch clips
        const response = await fetch(api_url, { headers });
        const data = await response.json();
        
        if (data.data.length === 0) { return null; }
        return data.data[0].login;
    }
    
    // load clients
    client.db = new MongoUtils();
    client.log = new Logger(client);

    // load prefixes
    await client.db.get('config', {}).then((result) => {
        result.forEach((config) => {
            channelPrefixes[config.channel] = config.prefix;
        });
    });

    // load channel configs
    client.channelConfigs = await client.db.get('config', {});
    client.reloadChannelConfigs = async function () {
        client.channelConfigs = await client.db.get('config', {});
    }
}



module.exports = {
    modifyClient: modifyClient,
    channelPrefixes: channelPrefixes,
};
