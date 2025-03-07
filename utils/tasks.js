const fs = require('fs');
const { exec } = require('child_process');
const { isStreamOnline, timeSince } = require('./utils.js');
const { addChannelToJustlog } = require('./justlog.js');

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

    await addChannelToJustlog(client, channelId);

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

        // add 2 seconds pause to avoid timeouts
        await new Promise(resolve => setTimeout(resolve, 2000));

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

            console.log(`* Joining ${channelName} to ${channelName}`);
            client.discord.importantLog(`* Joining to ${channelName} from website (inviter: ${inviterName})`);

            anonClient.join(channelName).catch((err) => {
                console.error(`Erro ao entrar no chat ${channelName}: ${err}`);
                client.discord.importantLog(`* Error joining ${channelName} from website: ${err}`);
                client.log.send(channelName, `Erro ao entrar no chat ${channelName}. Por favor contacte o @${process.env.DEV_NICK}`);
                client.log.whisper(inviterName, `Erro ao entrar no chat ${channelName}. Por favor contacte o @${process.env.DEV_NICK}`);
                return;
            });

            // create config
            createNewChannelConfig(client, channelId);
            client.channelsToJoin.push(channelName);
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
    const channelsToJoin = client.channelsToJoin;
    if (!channelsToJoin || channelsToJoin.length === 0) { return; } // to avoid errors
    let rejoinedChannels = [];

    channelsToJoin.forEach(async (channel) => {
        if (![...anonClient.joinedChannels].includes(channel)) {
            console.log(`* Rejoining ${channel}`);
            // client.discord.log(`* Rejoining ${channel}`);
            rejoinedChannels.push(channel);
            anonClient.join(channel);
        }
        else {
            if ([...anonClient.joinedChannels].length === 0) {
                counterToRestart++;
                if (counterToRestart >= 4) { // 2 minutes
                    console.log(`* Restarting client`);
                    client.discord.log(`* Restarting client`);
                    exec('pm2 restart folhinhajs');
                }
            }
            // console.log('all good ' + client.channelsToJoin);
        }
    });
    if (rejoinedChannels.length > 0) {
        console.log(`* Rejoining ${rejoinedChannels.length} channels`);
        client.discord.log(`* Rejoining ${rejoinedChannels.length} channels`);
    }
}

async function updateDiscordPresence(client, anonClient) {
    client.discord.user.setActivity({
        type: 4,
        name: 'Folhinha Uptime',
        state: `Up: ${timeSince(client.startTime)} - ${[...anonClient.joinedChannels].length}/${client.channelsToJoin.length}`,
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
