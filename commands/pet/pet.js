import { processCommand } from '../../utils/processCommand.js';
import { randomInt, randomChoice } from '../../utils/utils.js';

const petEmojis = [
    '🦝',
    '🐴',
    '🐶',
    '🦊',
    '🐯',
    '🐸',
    '🐱',
    '🐻',
    '🦁',
    '🐵',
    '🐭',
    '🐼',
    '🐮',
    '🐹',
    '🐻‍❄️',
    '🐷',
    '🐰',
    '🐨',
    '🐥',
    '🐔',
    '🐧',
    '🐦',
    '🐤',
    '🦅',
    '🦉',
    '🐴',
    '🦆',
    '🐺',
    '🦄',
    '🐝',
    '🪱',
    '🐛',
    '🦋',
    '🐌',
    '🐞',
    '🪰',
    '🪲',
    '🕷️',
    '🦎',
    '🦂',
    '🐢',
    '🐍',
    '🦑',
    '🐙',
    '🦕',
    '🦖',
    '🐬',
    '🐋',
    '🦭',
    '🐀',
    '🦇',
    '🐈‍⬛',
    '🐲',
    '🐉',
    '🐊',
    '🦔',
];

async function createPetBase(client, message) {
    console.log('running createPetBase');
    const insert_doc = {
        channel: message.channelName,
        channelId: message.channelID,
        pet_emoji: '',
        pet_name: '',
        is_alive: false,
        alive_since: 0,
        warns: 0,
        time_of_death: 0,
        total_plays: 0,
        total_pats: 0,
        last_interaction: 0,
        last_play: 0,
        last_pat: 0,
    };

    await client.db.insert('pet', insert_doc);
}

async function updatePetCreate(client, message, petEmoji, petName) {
    console.log('running updatePetCreate');
    const update_doc = {
        $set: {
            pet_emoji: petEmoji,
            pet_name: petName,
            is_alive: true,
            warns: 0,
            total_plays: 0,
            total_pats: 0,
            last_play: 0,
            last_pat: 0,
            last_interaction: Math.floor(Date.now() / 1000),
            alive_since: Math.floor(Date.now() / 1000),
        },
    };

    await client.db.update('pet', { channelId: message.channelID }, update_doc);
}

const petCommand = async (client, message) => {
    message.command = 'pet';
    if (!(await processCommand(5000, 'channel', message, client))) return;

    if (message.messageText.split(' ').length === 1) {
        client.log.logAndReply(
            message,
            `Para saber mais sobre os comandos de pet, acesse https://folhinhabot.com/comandos/pet 😁 `
        );
        return;
    }

    const args = message.messageText.split(' ').slice(1);

    let petStats = await client.db.get('pet', { channelId: message.channelID });
    petStats = petStats[0];

    if (['criar', 'create'].includes(args[0].toLowerCase())) {
        if (!message.isMod) {
            client.log.logAndReply(
                message,
                `Apenas o streamer e os mods podem criar um pet para o chat`
            );
            return;
        }

        if (petStats && petStats.is_alive) {
            client.log.logAndReply(
                message,
                `Já existe um pet para este chat. Se quiser matar (deletar) ele, digite ${message.commandPrefix}pet kill`
            );
            return;
        }

        const petEmoji = args[1];
        const petName = args.slice(2).join(' ');

        if (!petEmoji || !petName) {
            client.log.logAndReply(
                message,
                `Para criar um pet, use ${message.commandPrefix}pet criar <emoji> <nome>`
            );
            return;
        }

        if (!petEmojis.includes(petEmoji)) {
            client.log.logAndReply(
                message,
                `Esse emoji não é válido. Para uma lista de emojis válidos, acesse https://folhinhabot.com/emojis`
            );
            return;
        }

        if (!petStats) {
            await createPetBase(client, message);
        }

        await updatePetCreate(client, message, petEmoji, petName);

        client.log.logAndReply(message, `Novo pet criado! Oioi ${petEmoji} ${petName}`);
        return;
    }

    if (['kill', 'matar'].includes(args[0].toLowerCase())) {
        if (!message.isMod) {
            client.log.logAndReply(message, `Apenas o streamer e os mods podem matar um pet`);
            return;
        }

        if (!petStats || !petStats.is_alive) {
            client.log.logAndReply(
                message,
                `Não existe um pet para este chat. Para criar um pet, use ${message.commandPrefix}pet criar`
            );
            return;
        }

        const update_doc = {
            $set: {
                is_alive: false,
                time_of_death: 0,
            },
        };

        await client.db.update('pet', { channelId: message.channelID }, update_doc);

        client.log.logAndReply(message, `${petStats.pet_emoji} ${petStats.pet_name} foi morto`);
        return;
    }

    if (['stats', 'status'].includes(args[0].toLowerCase())) {
        if (!petStats || !petStats.is_alive) {
            client.log.logAndReply(
                message,
                `Não existe um pet para este chat. Para criar um pet, use ${message.commandPrefix}pet criar`
            );
            return;
        }

        let pet_mood;
        if (petStats.warns === 0) {
            pet_mood = 'feliz';
        } else if (petStats.warns === 1) {
            pet_mood = 'pedindo atenção';
        } else {
            pet_mood = 'rabugento por falta de atenção';
        }

        const pet_alive_since = petStats.alive_since;
        const currentTime = Math.floor(Date.now() / 1000);
        const elapsedDays = Math.floor((currentTime - pet_alive_since) / (24 * 60 * 60));

        client.log.logAndReply(
            message,
            `${petStats.pet_emoji} ${petStats.pet_name} está ${pet_mood}! Ele já recebeu ${petStats.total_pats} carinhos e ${petStats.total_plays} brincadeiras num total de ${elapsedDays} dias`
        );
    }
};

const carinhoCommand = async (client, message) => {
    message.command = 'carinho';
    if (!(await processCommand(5000, 'channel', message, client))) return;

    let petStats = await client.db.get('pet', { channelId: message.channelID });
    petStats = petStats[0];
    if (!petStats || !petStats.is_alive) {
        client.log.logAndReply(
            message,
            `Não existe um pet para este chat. Para criar um pet, use ${message.commandPrefix}pet criar`
        );
        return;
    }

    if (petStats.warns === 2 && randomInt(1, 2) === 1) {
        client.log.logAndReply(
            message,
            `${petStats.pet_emoji} ${petStats.pet_name} tá rabugento e não aceitou o seu carinho`
        );
        return;
    }

    const update_doc = {
        $set: {
            total_pats: petStats.total_pats + 1,
            warns: 0,
            last_interaction: Math.floor(Date.now() / 1000),
            last_pat: Math.floor(Date.now() / 1000),
        },
    };

    await client.db.update('pet', { channelId: message.channelID }, update_doc);

    client.log.logAndReply(
        message,
        `${petStats.pet_emoji} PETPET ${message.senderUsername} fez carinho em ${petStats.pet_emoji} ${petStats.pet_name}`
    );
};

const brincarCommand = async (client, message) => {
    message.command = 'brincar';
    if (!(await processCommand(5000, 'channel', message, client))) return;

    let petStats = await client.db.get('pet', { channelId: message.channelID });
    petStats = petStats[0];
    if (!petStats || !petStats.is_alive) {
        client.log.logAndReply(
            message,
            `Não existe um pet para este chat. Para criar um pet, use ${message.commandPrefix}pet criar`
        );
        return;
    }

    if (petStats.warns === 2 && randomInt(1, 2) === 1) {
        client.log.logAndReply(
            message,
            `${petStats.pet_emoji} ${petStats.pet_name} tá rabugento e não quis brincar com você`
        );
        return;
    }

    const update_doc = {
        $set: {
            total_plays: petStats.total_plays + 1,
            warns: 0,
            last_interaction: Math.floor(Date.now() / 1000),
            last_play: Math.floor(Date.now() / 1000),
        },
    };

    await client.db.update('pet', { channelId: message.channelID }, update_doc);

    const tesouros = [
        `um osso de ouro`,
        `um diamante`,
        `um pedaço de queijo podre`,
        `a minha vontade de viver`,
        `uma chave secreta`,
        `um mapa do tesouro`,
        `um mapa misterioso`,
        `R$ ${randomInt(100, 1000000)} enterrados`,
    ];

    const brincadeiras = [
        `${message.senderUsername} brincou com ${petStats.pet_emoji} ${petStats.pet_name} de apanhar a bola ⚽ mas o pet ficou só olhando`,
        `${message.senderUsername} brincou com ${petStats.pet_emoji} ${petStats.pet_name} de esconde-esconde 🙈 e você conseguiu encontrar o pet em ${randomInt(3, 15)} minutos! 🏆`,
        `${message.senderUsername} brincou com ${petStats.pet_emoji} ${petStats.pet_name} de esconde-esconde 🙈 mas não conseguiu encontrar o pet, ele é muito bom! 🏆`,
        `${message.senderUsername} brincou com ${petStats.pet_emoji} ${petStats.pet_name} de pega-pega 🏃‍♂️ e você conseguiu pegar o pet em ${randomInt(3, 15)} minutos! 🏆`,
        `${message.senderUsername} brincou com ${petStats.pet_emoji} ${petStats.pet_name} de pega-pega 🏃‍♂️ mas o pet é muito rápido e você não conseguiu pegar ele! 🏆`,
        `${message.senderUsername} brincou com ${petStats.pet_emoji} ${petStats.pet_name} de luta de travesseiro e você conseguiu vencer ao pet! 🏆`,
        `${message.senderUsername} brincou com ${petStats.pet_emoji} ${petStats.pet_name} de luta de travesseiro mas o pet é muito forte e destruiu você! 🏆`,
        `${message.senderUsername} brincou com ${petStats.pet_emoji} ${petStats.pet_name} de pular corda e vocês conseguiram pular ${randomInt(10, 100)} vezes seguidas! 🏆`,
        `${message.senderUsername} brincou com ${petStats.pet_emoji} ${petStats.pet_name} de pular corda mas você tropeçou e caiu! 🏆`,
        `${message.senderUsername} brincou com ${petStats.pet_emoji} ${petStats.pet_name} de olhar seriamente 👀 e você ganhou! 🏆`,
        `${message.senderUsername} brincou com ${petStats.pet_emoji} ${petStats.pet_name} de olhar seriamente 👀 mas o pet é muito sério e ganhou! 🏆`,
        `${message.senderUsername} brincou com ${petStats.pet_emoji} ${petStats.pet_name} de caça ao tesouro 🗺 e acharam ${randomChoice(tesouros)}`,
    ];

    const brincadeira = randomChoice(brincadeiras);
    client.log.logAndReply(message, brincadeira);
};

petCommand.commandName = 'pet';
petCommand.aliases = ['pet'];
petCommand.shortDescription = 'Faça várias coisas relacionadas ao pet do chat';
petCommand.cooldown = 5000;
petCommand.whisperable = false;
petCommand.description = `Com este comando, você por ter um pet único no seu chat e poderá fazer algumas coisas com ele, como:
Para criar um pet, use o comando !pet criar {emoji} {nome do pet}
• Exemplo: !pet criar 🐶 Max - O bot irá criar um pet chamado Max com o emoji 🐶

Para ver algumas informações sobre o pet, use o comando !pet stats
Este comando mostra quantos carinhos o pet já recebeu, quantas vezes ele brincou e o total de dias desde que ele foi criado

Se quiser sacrificar o seu pet, para talvez criar um outro com nome diferente, use o comando !pet matar`;
petCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/${petCommand.commandName}/${petCommand.commandName}.js`;
petCommand.emojis = petEmojis;

carinhoCommand.commandName = 'carinho';
carinhoCommand.aliases = ['carinho', 'pat'];
carinhoCommand.shortDescription = 'Faça carinho no pet do chat';
carinhoCommand.cooldown = 5000;
carinhoCommand.whisperable = false;
carinhoCommand.description = 'Faça carinho no pet do canal e ajude a mantê-lo saudável.';
carinhoCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/${petCommand.commandName}/${petCommand.commandName}.js`;

brincarCommand.commandName = 'brincar';
brincarCommand.aliases = ['brincar', 'play'];
brincarCommand.shortDescription = 'Brinque com o pet do chat';
brincarCommand.cooldown = 5000;
brincarCommand.whisperable = false;
brincarCommand.description = 'Brinque com o pet do canal e ajude a mantê-lo saudável.';
brincarCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/${petCommand.commandName}/${petCommand.commandName}.js`;

export { petCommand, carinhoCommand, brincarCommand };
