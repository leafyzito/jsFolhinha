const fetch = require('node-fetch');
const schedule = require('node-schedule');
const { MongoUtils } = require('./mongo.js');
const { TursoUtils } = require('./turso.js');
const { Logger } = require('./log.js');
const { Emotes } = require('./emotes.js');
const { discordClient } = require('./discord.js');
const { loadCommands } = require('../commands/commandsList.js');
const { timeSince, manageLongResponse } = require('./utils.js');

async function modifyClient(client) {
    client.ready = false;
    client.userIdCache = new Map(); // Cache for user IDs
    client.userIdCacheTimeout = 24 * 60 * 60 * 1000; // 24 hour cache timeout

    client.getUserID = async function (username) {
        username = username.toLowerCase();
        // Check cache first
        const cached = client.userIdCache.get(username);
        if (cached) {
            if (Date.now() - cached.timestamp < client.userIdCacheTimeout) {
                return cached.id;
            }
            // Cache expired, remove it
            client.userIdCache.delete(username);
        }

        // Not in cache, make API request
        const api_url = `https://api.twitch.tv/helix/users?login=${username}`;
        const headers = { "Client-ID": process.env.BOT_CLIENT_ID, "Authorization": `Bearer ${process.env.BOT_OAUTH_TOKEN}` };
        const response = await fetch(api_url, { headers });
        const data = await response.json();

        if (!response.ok || data.data.length === 0) { return null; }

        // Cache the result
        client.userIdCache.set(username, {
            id: data.data[0].id,
            timestamp: Date.now()
        });

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

        if (!response.ok || data.data.length === 0) { return null; }
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

        if (!response.ok || data.data.length === 0) { return null; }

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

    // handmade whisper function, i think this works?
    client.whisper = async function (whisperTarget, message) {
        const whisperTargetId = await client.getUserID(whisperTarget);

        const api_url = `https://api.twitch.tv/helix/whispers?from_user_id=${process.env.BOT_USERID}&to_user_id=${whisperTargetId}`;
        const headers = {
            'Authorization': 'Bearer ' + process.env.BOT_OAUTH_TOKEN,
            'Client-ID': process.env.BOT_CLIENT_ID,
            'Content-Type': 'application/json'
        };
        const data = {
            'message': message,
        };

        const response = await fetch(api_url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(data)
        }).catch(err => { console.log(`Error in whisper: ${err}`); });

        if (response.status === 429) {
            console.log(`* Whisper rate limit reached`);
            client.discord.log(`* Whisper rate limit reached`);
            return;
        }
    }

    // get channelsToJoin from database
    client.getChannelsToJoin = async function () {
        let channelIdsToJoin = [];
        await client.db.get('config').then((result) => {
            result.forEach((channel) => {
                channelIdsToJoin.push(channel.channelId);
            });
        });

        client.joinedChannelsIds = channelIdsToJoin;
        const channelsToJoin = client.getManyUsersByUserIDs(channelIdsToJoin);
        // client.channelsToJoin = channelsToJoin; for sake of local testing

        return channelsToJoin;
    }

    // load commands
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
    client.turso = new TursoUtils();
    client.log = new Logger(client);

    // load prefixes
    client.channelPrefixes = {};
    client.reloadChannelPrefixes = async function () {
        await new Promise(resolve => setTimeout(resolve, 1000));
        client.channelPrefixes = {};
        await client.db.get('config', {}, true).then((result) => {
            result.forEach((config) => {
                client.channelPrefixes[config.channel] = config.prefix;
            });
        });
    }

    await client.reloadChannelPrefixes();

    // load channel configs
    client.channelConfigs = {};
    client.reloadChannelConfigs = async function () {
        await new Promise(resolve => setTimeout(resolve, 1000));
        client.channelConfigs = {};
        await client.db.get('config', {}, true).then((result) => {
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
    client.reminderJobs = {};
    client.reloadReminders = async function () {
        client.usersWithPendingReminders = [];
        const currentTime = Math.floor(Date.now() / 1000);
        await client.db.get('remind', { beenRead: false }).then(async (result) => {
            for (const reminder of result) {
                if (!client.usersWithPendingReminders.includes(reminder.receiverId)) {
                    if (reminder.remindAt === null || reminder.remindAt === 0) {
                        client.usersWithPendingReminders.push(reminder.receiverId);
                    }
                }
                if (reminder.remindAt <= currentTime || reminder.remindAt > currentTime) {
                    try {

                        if (!client.scheduledReminders.includes(reminder._id)) {
                            const reminderDate = new Date(reminder.remindAt * 1000);
                            client.scheduledReminders.push(reminder._id);

                            if (reminder.remindAt && reminder.remindAt <= currentTime) {
                                client.discord.log(`* Sending missed reminder for ${reminderDate.toLocaleString()}`);
                                console.log('* Sending missed reminder for ' + reminderDate.toLocaleString());

                                const reminderSender = await client.getUserByUserID(reminder.senderId) || 'Usuário deletado';
                                const receiverName = await client.getUserByUserID(reminder.receiverId) || 'Usuário deletado 2';
                                const reminderMessage = timeSince(reminder.remindTime);
                                let finalRes = reminderSender === receiverName
                                    ? `@${receiverName}, lembrete de você mesmo há ${reminderMessage}: ${reminder.remindMessage}`
                                    : `@${receiverName}, lembrete de @${reminderSender} há ${reminderMessage}: ${reminder.remindMessage}`;

                                if (finalRes.length > 480) { finalRes = await manageLongResponse(finalRes); }

                                const channelName = await client.getUserByUserID(reminder.fromChannelId);
                                await client.log.send(channelName, finalRes);
                                await client.db.update('remind', { _id: reminder._id }, { $set: { beenRead: true } });

                            } else if (reminder.remindAt > currentTime) {
                                // client.discord.log(`* Setting timed reminder for ${reminderDate.toLocaleString()}`);
                                console.log('* Setting timed reminder for ' + reminderDate.toLocaleString());

                                const job = schedule.scheduleJob(new Date(reminder.remindAt * 1000), async function () {
                                    const reminderSender = await client.getUserByUserID(reminder.senderId) || 'Usuário deletado';
                                    const receiverName = await client.getUserByUserID(reminder.receiverId) || 'Usuário deletado 2';
                                    const howLongAgo = timeSince(reminder.remindTime);
                                    let finalRes = reminderSender === receiverName
                                        ? `@${receiverName}, lembrete de você mesmo há ${howLongAgo}: ${reminder.remindMessage}`
                                        : `@${receiverName}, lembrete de @${reminderSender} há ${howLongAgo}: ${reminder.remindMessage}`;

                                    if (finalRes.length > 480) { finalRes = await manageLongResponse(finalRes); }

                                    const channelName = await client.getUserByUserID(reminder.fromChannelId);
                                    // check if channel is still in configs and check for if it's paused, reminds are banned and offlineOnly
                                    if (!client.channelConfigs[channelName] ||
                                        client.channelConfigs[channelName].isPaused ||
                                        client.channelConfigs[channelName].disabledCommands.includes('remind') ||
                                        (client.channelConfigs[channelName].offlineOnly && await isStreamOnline(channelName))) {
                                        // send in whisper to receiverName if channel is paused, reminds are banned or offlineOnly with stream online
                                        await client.log.whisper(receiverName, finalRes);
                                        await client.db.update('remind', { _id: reminder._id }, { $set: { beenRead: true } });
                                    }
                                    else {
                                        // send in channel if channel is not paused, reminds are not banned and not offlineOnly
                                        await client.log.send(channelName, finalRes);
                                        await client.db.update('remind', { _id: reminder._id }, { $set: { beenRead: true } });
                                    }
                                });

                                // Store the job in a global object to associate it with the reminderId
                                client.reminderJobs[reminder._id] = job;
                            }
                        }

                    } catch (err) {
                        console.log(`Error in reminder: ${err} // Reminder: ${reminder}`);
                        client.discord.logError(`Error in reminder: ${err} // Reminder: ${reminder}`);
                    }
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
    console.log(`* Loaded ${client.knownUserAliases.length} users`);
    client.discord.log(`* Loaded ${client.knownUserAliases.length} users`);
    client.ready = true;
}



module.exports = {
    modifyClient,
};
