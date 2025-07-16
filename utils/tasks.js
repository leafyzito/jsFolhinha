const fs = require('fs');
const { exec } = require('child_process');
const { isStreamOnline, timeSince, timeSinceDT } = require('./utils.js');
const { addChannelToRustlog } = require('./rustlog.js');

async function createNewChannelConfig(client, channelId) {
    const channelName = await client.getUserByUserID(channelId);
    const newConfig = {
        channel: channelName,
        channelId: channelId,
        prefix: '!',
        offlineOnly: false,
        isPaused: false,
        disabledCommands: [],
        devBanCommands: []
    };

    await client.db.insert('config', newConfig);
    await client.reloadChannelConfigs();
    await client.reloadChannelPrefixes();

    await addChannelToRustlog(client, channelId);

    fs.appendFile('channels.txt',
        `${channelId} ${channelName}\n`,
        (err) => {
            if (err) {
                console.error(`Erro ao adicionar ${channelName} ao channels.txt: ${err}`);
                return;
            }
            console.log('Data appended to channels.txt');
        });

    return;
}

async function getUserInfo(username) {
    const api_url = `https://api.ivr.fi/v2/twitch/user?login=${username}`;
    const response = await fetch(api_url);
    const data = await response.json();

    if (data === null || data == [] || data.length === 0) { return null; }

    const displayName = data[0].displayName;
    const userId = data[0].id;
    const badge = data[0].badges.length > 0 ? data[0].badges[0].title : 'Nenhuma';
    const chatterCount = data[0].chatterCount;
    const createdAt = timeSinceDT(data[0].createdAt)[1];
    const howLongCreated = timeSinceDT(data[0].createdAt)[0];
    const followers = data[0].followers;
    const isLive = data[0].stream !== null ? true : false;
    const lastStream = data[0].lastBroadcast.startedAt ? timeSinceDT(data[0].lastBroadcast.startedAt)[0] : null;
    const isBanned = data[0].banned;
    const banReason = data[0].banReason || null;

    return { displayName, userId, badge, chatterCount, createdAt, howLongCreated, followers, isLive, lastStream, isBanned, banReason };
}


async function dailyCookieResetTask(client) {
    client.discord.log('* Resetting daily cookies');
    console.log('* Resetting daily cookies');

    await client.db.updateMany('cookie', {}, {
        $set: {
            claimedToday: false,
            giftedToday: false,
            usedSlot: false
        }
    });
}

async function petAttencionTask(client, anonClient) {
    // Your async code here
    // console.log("* Running pet attention task");

    const pets = await client.db.get('pet', { is_alive: true }, true);
    for (const pet of pets) {
        const channel = await client.getUserByUserID(pet.channelId);
        // if not connected to channel, skip (for the case the bot leaves the channel)
        if (![...anonClient.joinedChannels].includes(channel)) { continue; }

        const lastInteraction = pet.last_interaction;
        const warns = pet.warns;
        const currentTime = Math.floor(Date.now() / 1000);
        const elapsedTime = currentTime - lastInteraction;

        // 15 hours since last interaction
        if (elapsedTime > 54_000 && warns === 0) {
            // 1st warning
            console.log(`* 1st warning for ${channel}`);

            if (await isStreamOnline(channel)) {
                console.log(`* ${channel} is paused or streaming, skipping and adding 10mins`);
                await client.db.update('pet', { channelId: pet.channelId }, { $inc: { last_interaction: 600 } }); // add 10 minutes to last_interaction
                continue;
            }

            client.log.send(channel, `${pet.pet_emoji} ${pet.pet_name} está pedindo atenção! Se ninguém interagir com ele, ele vai ficar rabugento!`);
            await new Promise(resolve => setTimeout(resolve, 2000)); // Add delay after sending message to avoid timeouts
            await client.db.update('pet', { channelId: pet.channelId }, { $set: { warns: 1 } });
            continue;
        }

        // 30 hours since last interaction
        if (elapsedTime > 108_000 && warns === 1) {
            // 2nd warning
            console.log(`* 2nd warning for ${channel}`);

            if (client.channelConfigs[channel].isPaused || await isStreamOnline(channel)) {
                console.log(`* ${channel} is paused or streaming, skipping and adding 10mins`);
                await client.db.update('pet', { channelId: pet.channelId }, { $inc: { last_interaction: 600 } }); // add 10 minutes to last_interaction
                continue;
            }

            client.log.send(channel, `${pet.pet_emoji} ${pet.pet_name} ficou rabugento! Já se passaram mais de 24 horas desde a última interação!`);
            await new Promise(resolve => setTimeout(resolve, 2000)); // Add delay after sending message to avoid timeouts
            await client.db.update('pet', { channelId: pet.channelId }, { $set: { warns: 2 } });
            continue;
        }

        // 50 hours since last interaction
        if (elapsedTime > 180_000 && warns === 2) {
            // 3rd warning
            console.log(`* 3rd warning for ${channel}`);

            if (client.channelConfigs[channel].isPaused || await isStreamOnline(channel)) {
                console.log(`* ${channel} is paused or streaming, skipping and adding 10mins`);
                await client.db.update('pet', { channelId: pet.channelId }, { $inc: { last_interaction: 600 } }); // add 10 minutes to last_interaction
                continue;
            }

            client.log.send(channel, `${pet.pet_emoji} ${pet.pet_name} foi embora! Ninguém deu atenção a ele e ele se foi...`);
            await new Promise(resolve => setTimeout(resolve, 2000)); // Add delay after sending message to avoid timeouts
            await client.db.update('pet', { channelId: pet.channelId }, { $set: { is_alive: false, time_of_death: currentTime } });
            continue;
        }

        // console.log('all good for ' + channel);
    }
}

async function fetchPendingJoins(client, anonClient) {
    const pendingJoins = await client.db.get('pendingjoin', { status: 'pending' }, true);
    for (const channelToJoin of pendingJoins) {
        // channel to join info
        const channelId = channelToJoin.channelid;
        const channelName = await client.getUserByUserID(channelId);
        // person who invited the bot info
        const inviterId = channelToJoin.inviterid;
        const inviterName = await client.getUserByUserID(inviterId);

        if (channelName) {
            // this should never happen, but let's test it    
            const alreadyJoinedChannels = [...anonClient.joinedChannels];
            if (alreadyJoinedChannels.includes(channelName)) {
                console.log(`* ${channelName} is already joined`);
                await client.db.update('pendingjoin', { _id: channelToJoin._id }, { $set: { status: 'duplicate' } });
                continue;
            }

            // get user info for joining log
            const userInfo = await getUserInfo(channelName);

            console.log(`* Joining ${channelName} to ${channelName}`);
            
            if (userInfo) {
                client.discord.importantLog(`* Joining to ${channelName} from website (inviter: ${inviterName})\n${userInfo.isBanned ? `🚫 Banido: ${userInfo.banReason} • ` : ''}  @${userInfo.displayName} • ID: ${userInfo.userId} • Badge: ${userInfo.badge} • Chatters: ${userInfo.chatterCount} • Seguidores: ${userInfo.followers} • Criado há ${userInfo.howLongCreated} (${userInfo.createdAt}) ${userInfo.isLive ? '• 🔴 Em live agora' : ''} ${userInfo.lastStream && !userInfo.isLive ? `• Última live: há ${userInfo.lastStream}` : ''}`);
            } else {
                client.discord.importantLog(`* Joining to ${channelName} from website (inviter: ${inviterName})\nCould not fetch user info from API`);
            }

            // create config
            createNewChannelConfig(client, channelId);

            // join channel
            anonClient.join(channelName).catch((err) => {
                console.error(`Erro ao entrar no chat ${channelName}: ${err}`);
                client.discord.importantLog(`* Error joining ${channelName} from website: ${err}`);
                client.log.send(channelName, `Erro ao entrar no chat ${channelName}. Por favor contacte o @${process.env.DEV_NICK}`);
                client.log.whisper(inviterName, `Erro ao entrar no chat ${channelName}. Por favor contacte o @${process.env.DEV_NICK}`);
                return;
            });

            // update lists
            client.channelsToJoin.push(channelName);
            anonClient.channelsToJoin.push(channelName);
            client.joinedChannelsIds.push(channelId);

            const emote = await client.emotes.getEmoteFromList(channelName, ['peepohey', 'heyge'], 'KonCha');
            const inviterPart = inviterName != channelName ? ` por @${inviterName}` : '';
            client.log.send(channelName, `${emote} Oioi! Fui convidado para me juntar aqui${inviterPart}! Para saber mais sobre mim, pode usar !ajuda ou !comandos`);
            client.log.whisper(inviterName, `Caso tenha follow-mode ativado no chat para o qual me convidou, me dê cargo de moderador ou vip para conseguir falar lá :D`);


            await client.db.update('pendingjoin', { _id: channelToJoin._id }, { $set: { status: 'joined' } });
        }
        else {
            console.log(`* ${channelToJoin.userid} not found from website`);
            client.discord.importantLog(`* ${channelToJoin.userid} not found from website`);
            await client.db.update('pendingjoin', { _id: channelToJoin._id }, { $set: { status: 'user not found' } });
        }

        // console.log('all good dentro do for loop');
    }
    // console.log('all good já FORA do for loop');
}

let counterToRestart = 0;
async function rejoinDisconnectedChannels(client, anonClient) {
    const channelsToJoin = [...new Set([...client.channelsToJoin, ...anonClient.channelsToJoin])]; // remove duplicates
    if (!channelsToJoin || channelsToJoin.length === 0) { return; } // to avoid errors
    let rejoinedChannels = [];

    channelsToJoin.forEach(async (channel) => {
        if (![...anonClient.joinedChannels].includes(channel)) {
            console.log(`* Rejoining ${channel}`);
            // client.discord.log(`* Rejoining ${channel}`);
            rejoinedChannels.push(channel);
            anonClient.join(channel);
        }
    });
    
    if (rejoinedChannels.length > 0) {
        if (rejoinedChannels.length == channelsToJoin.length) { // sometimes the client bugs and doesn't join channel anymore, so restart the bot
            counterToRestart++;
            if (counterToRestart >= 4) { // 2 minutes
                console.log(`* Restarting client`);
                client.discord.log(`* Restarting client`);
                
                exec('docker compose restart', { cwd: process.cwd() }, (err, stdout, stderr) => {
                    if (err) {
                        console.log(`* Erro ao reiniciar compose: ${err}`);
                        client.discord.log(`* Erro ao reiniciar compose: ${err}`);
                        return;
                    }

                    if (stderr) {
                        console.log(`* Docker stderr: ${stderr}`);
                    }

                    console.log(`* Compose reiniciado: ${stdout}`);
                    client.discord.log(`* Compose reiniciado: ${stdout}`);
                });
            }
        }
        console.log(`* Rejoining ${rejoinedChannels.length} channels`);
        client.discord.log(`* Rejoining ${rejoinedChannels.length} channels`);
    }
}

async function updateDiscordPresence(client, anonClient) {
    client.discord.user.setActivity({
        type: 4,
        name: 'Folhinha Uptime',
        state: `Up: ${timeSince(client.startTime)} - ${[...anonClient.joinedChannels].length}/${[...anonClient.channelsToJoin].length}`,
    });
}

function startPetTask(client, anonClient) {
    // run every X time
    setInterval(() => petAttencionTask(client, anonClient), 60_000); // 1 minute
}

function startFetchPendingJoinsTask(client, anonClient) {
    // run every X time
    setInterval(() => fetchPendingJoins(client, anonClient), 10_000); // 10 seconds
}

function startRejoinDisconnectedChannelsTask(client, anonClient) {
    // run every X time
    setInterval(() => rejoinDisconnectedChannels(client, anonClient), 30_000); // 30 seconds
}

function startDiscordPresenceTask(client, anonClient) {
    // run every X time
    setInterval(() => updateDiscordPresence(client, anonClient), 60_000); // 1 minute
}



module.exports = {
    dailyCookieResetTask,
    startPetTask,
    startFetchPendingJoinsTask,
    startRejoinDisconnectedChannelsTask,
    startDiscordPresenceTask
};
