const { isStreamOnline } = require('./utils.js');

async function dailyCookieResetTask(client) {
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
    console.log("* Running pet attention task");

    const pets = await client.db.get('pet', { is_alive: true });
    for (const pet of pets) {
        const lastInteraction = pet.last_interaction;
        const warns = pet.warns;

        const currentTime = Math.floor(Date.now() / 1000);
        const elapsedTime = currentTime - lastInteraction;

        // 15 hours since last interaction
        if (elapsedTime > 54_000 && warns === 0) {
            // 1st warning
            console.log(`* 1st warning for ${pet.channel}`);

            if (await isStreamOnline(pet.channel)) {
                console.log(`* ${pet.channel} is paused or streaming, skipping and adding 10mins`);
                await client.db.update('pet', { channel: pet.channel }, { $inc: { last_interaction: 600 } }); // add 10 minutes to last_interaction
                continue;
            }

            client.log.send(pet.channel, `${pet.pet_emoji} ${pet.pet_name} tá pedindo atenção! Se não interagir com ele, ele vai ficar rabugento!`);
            await client.db.update('pet', { channel: pet.channel }, { $set : { warns: 1 } });
            continue;
        }

        // 30 hours since last interaction
        if (elapsedTime > 108_000 && warns === 1) {
            // 2nd warning
            console.log(`* 2nd warning for ${pet.channel}`);

            if (client.channelConfigs[pet.channel].isPaused || await isStreamOnline(pet.channel)) {
                console.log(`* ${pet.channel} is paused or streaming, skipping and adding 10mins`);
                await client.db.update('pet', { channel: pet.channel }, { $inc: { last_interaction: 600 } }); // add 10 minutes to last_interaction
                continue;
            }

            client.log.send(pet.channel, `${pet.pet_emoji} ${pet.pet_name} ficou rabugento! Já se passaram mais de 24 horas desde a última interação!`);
            await client.db.update('pet', { channel: pet.channel }, { $set : { warns: 2 } });
            continue;
        }

        // 50 hours since last interaction
        if (elapsedTime > 180_000 && warns === 2) {
            // 3rd warning
            console.log(`* 3rd warning for ${pet.channel}`);

            if (client.channelConfigs[pet.channel].isPaused || await isStreamOnline(pet.channel)) {
                console.log(`* ${pet.channel} is paused or streaming, skipping and adding 10mins`);
                await client.db.update('pet', { channel: pet.channel }, { $inc: { last_interaction: 600 } }); // add 10 minutes to last_interaction
                continue;
            }

            client.log.send(pet.channel, `${pet.pet_emoji} ${pet.pet_name} foi embora! Ningúem deu atenção a ele e ele se foi...`);
            await client.db.update('pet', { channel: pet.channel }, { $set : { is_alive: false, time_of_death: currentTime } });
            continue;
        }
        
        console.log('all good for ' + pet.channel);

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
