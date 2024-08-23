const fetch = require('node-fetch');
const schedule = require('node-schedule');
const { MongoUtils } = require('./mongo.js');
const { Logger } = require('./log.js');
const { Emotes } = require('./emotes.js');
const { discordClient } = require('./discord.js');
const { loadCommands } = require('../commands/commandsList.js');
const { timeSince, manageLongResponse } = require('./utils.js');

async function modifyClient(client) {
    client.ready = false;
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

    client.getManyUsersByUserIDs = async function (userIds) {
        var userIdsToUrl = userIds.join('&id=');

        const api_url = `https://api.twitch.tv/helix/users?id=${userIdsToUrl}`;
        // Set headers with API credentials
        const headers = { "Client-ID": process.env.BOT_CLIENT_ID, "Authorization": `Bearer ${process.env.BOT_OAUTH_TOKEN}` };
        // Make API request to fetch clips
        const response = await fetch(api_url, { headers });
        const data = await response.json();
        // console.log(data);

        if (data.data.length === 0) { return null; }

        var listOfUsers = [];
        data.data.forEach((user) => {
            listOfUsers.push(user.login);
        });
        return listOfUsers;
    } 


    client.timeoutUser = async function (message, duration, reason) {
        const api_url = `https://api.twitch.tv/helix/moderation/bans?broadcaster_id=${message.channelID}&moderator_id=${process.env.BOT_USERID}`;
        const headers = { "Client-ID": process.env.BOT_CLIENT_ID, "Authorization": `Bearer ${process.env.BOT_OAUTH_TOKEN}`, "Content-Type": "application/json" };
        const payload = { data: { user_id: message.senderUserID, duration: duration, reason: reason } };
        const response = await fetch(api_url, { method: 'POST', headers, body: JSON.stringify(payload) });
        const resCode = response.status;

        if (resCode === 403) { return false; }

        return true;
    }
    
    client.loadCommands = function () {
        client.commandsList = loadCommands();
    }
    
    client.loadCommands();


    // load discord client
    client.discord = discordClient;

    // load emotes
    client.emotes = new Emotes(client);
    
    // load clients
    client.db = new MongoUtils();
    client.log = new Logger(client);
    
    // load prefixes
    client.channelPrefixes = {};
    client.reloadChannelPrefixes = async function () {
        client.channelPrefixes = {};
        await client.db.get('config', {}).then((result) => {
            result.forEach((config) => {
                client.channelPrefixes[config.channel] = config.prefix;
            });
        });
    }
    
    await client.reloadChannelPrefixes();

    // load channel configs
    client.channelConfigs = {};
    client.reloadChannelConfigs = async function () {
        client.channelConfigs = {};
        await client.db.get('config', {}).then((result) => {
            result.forEach((config) => {
                client.channelConfigs[config.channel] = config;
            });
        });
    }
    
    await client.reloadChannelConfigs();

    client.startTime = Math.floor(Date.now() / 1000);

    // load afk users
    client.afkUsers = {};
    client.reloadAfkUsers = async function () {
        client.afkUsers = {};
        await client.db.get('afk', { is_afk: true }).then((result) => {
            result.forEach((afk) => {
                if (!client.afkUsers[afk.channel]) {
                    client.afkUsers[afk.channel] = [];
                }
                client.afkUsers[afk.channel].push(afk.user);
            });
        });
    }

    await client.reloadAfkUsers();

    // load reminders
    client.usersWithPendingReminders = [];
    client.notifiedUsers = [];
    client.scheduledReminders = [];
    client.reloadReminders = async function () {
        client.usersWithPendingReminders = [];
        await client.db.get('remind', { beenRead: false }).then(async (result) => {
            for (const reminder of result) {
                if (!client.usersWithPendingReminders.includes(reminder.receiverId)) {
                    if (reminder.remindAt === null || reminder.remindAt === 0) { 
                            client.usersWithPendingReminders.push(reminder.receiverId); 
                    }
                }
                if (reminder.remindAt > Math.floor(Date.now() / 1000)) {
                    if (client.scheduledReminders.includes(reminder._id)) { continue; }
                    client.scheduledReminders.push(reminder._id);

                    const reminderDate = new Date(reminder.remindAt * 1000);
                    console.log('* Setting timed reminder for ' + reminderDate.toLocaleString());

                    schedule.scheduleJob(new Date(reminder.remindAt * 1000), async function() {
                        const reminderSender = await client.getUserByUserID(reminder.senderId) || 'Usuário deletado';
                        const receiverName = await client.getUserByUserID(reminder.receiverId) || 'Usuário deletado 2';
                        const reminderMessage = timeSince(reminder.remindTime);
                        finalRes = reminderSender === receiverName
                            ? `@${receiverName}, lembrete de você mesmo há ${reminderMessage}: ${reminder.remindMessage}`
                            : `@${receiverName}, lembrete de @${reminderSender} há ${reminderMessage}: ${reminder.remindMessage}`;

                        if (finalRes.length > 480) { finalRes = await manageLongResponse(finalRes); }
                        
                        const channelName = await client.getUserByUserID(reminder.fromChannelId);
                        await client.log.send(channelName, finalRes);
                        await client.db.update('remind', { _id: reminder._id }, { $set : { beenRead: true } });
                        // await client.reloadReminders();
                    });
                }
            }
        });
    }

    await client.reloadReminders();

    // load bans
    client.bans = {};
    client.reloadBans = async function () {
        client.bans = {};
        await client.db.get('bans', {}).then((result) => {
            result.forEach((ban) => {
                client.bans[ban.userId] = ban.bannedCommands;
            });
        });
    }

    await client.reloadBans();

    // load known users
    client.knownUserAliases = [];
    client.reloadKnownUsers = async function () {
        client.knownUserAliases = [];
        await client.db.get('users', {}).then((result) => {
            result.forEach((user) => {
                client.knownUserAliases.push(user.currAlias);
            });
        });
    }

    await client.reloadKnownUsers();
    console.log('* Loaded users');
    client.ready = true;
}



module.exports = {
    modifyClient,
};
