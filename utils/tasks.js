const { isStreamOnline } = require('./utils.js');

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

async function petAttencionTask(client) {
    // Your async code here
    // console.log("* Running pet attention task");

    const pets = await client.db.get('pet', { is_alive: true });
    for (const pet of pets) {
        const channel = await client.getUserByUserID(pet.channelId);
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

            client.log.send(channel, `${pet.pet_emoji} ${pet.pet_name} tá pedindo atenção! Se não interagir com ele, ele vai ficar rabugento!`);
            await client.db.update('pet', { channelId: pet.channelId }, { $set : { warns: 1 } });
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
            await client.db.update('pet', { channelId: pet.channelId }, { $set : { warns: 2 } });
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

            client.log.send(channel, `${pet.pet_emoji} ${pet.pet_name} foi embora! Ningúem deu atenção a ele e ele se foi...`);
            await client.db.update('pet', { channelId: pet.channelId }, { $set : { is_alive: false, time_of_death: currentTime } });
            continue;
        }
        
        // console.log('all good for ' + channel);
    }
}

function startPetTask(client) {
    // run every X time
    setInterval(() => petAttencionTask(client), 60_000); // 1 minute
}


module.exports = {
    dailyCookieResetTask,
    startPetTask
};
