import { processCommand } from '../../utils/processCommand.js';

const randomEmoteCommand = async (client, message) => {
    message.command = 'randomemote';
    if (!(await processCommand(5000, 'channel', message, client))) return;

    let amount = message.messageText.split(' ')[1] || 1;
    amount = parseInt(amount);
    if (isNaN(amount) || amount < 1) {
        amount = 1;
    }

    if (amount > 50) {
        client.log.logAndReply(message, `O limite máximo é 50`);
        return;
    }

    const channelEmotes = await client.emotes.getChannelEmotes(message.channelName);
    let emotesList = [];

    for (let i = 0; i < amount; i++) {
        let randomEmote = Math.floor(Math.random() * channelEmotes.length);

        if (emotesList.includes(channelEmotes[randomEmote])) {
            continue;
        }

        while (
            [
                '$',
                '*',
                '!',
                '|',
                '+',
                '?',
                '%',
                '=',
                '&',
                '/',
                '#',
                '.',
                ',',
                '<',
                '>',
                '@',
                '⠀',
                '-',
                '\\',
                '\\',
            ].some(char => channelEmotes[randomEmote].startsWith(char))
        ) {
            randomEmote = Math.floor(Math.random() * channelEmotes.length);
        }

        emotesList.push(channelEmotes[randomEmote]);
    }

    let finalRes = emotesList.join(' ').substring(0, 490);
    client.log.logAndReply(message, `🤖 ${finalRes}`);
};

randomEmoteCommand.commandName = 'randomemote';
randomEmoteCommand.aliases = ['randomemote', 'rem', 'emote', 'emotes'];
randomEmoteCommand.shortDescription = 'Mostra um emote aleatório do canal atual';
randomEmoteCommand.cooldown = 5000;
randomEmoteCommand.whisperable = false;
randomEmoteCommand.description = `Faça o bot escolher entre 1 e 50 emotes aleatórios do seu chat
Estes emotes são apenas do FFZ, BTTV e 7TV
• Exemplo: !randomemote - O bot vai escolher 1 emote aleatório do seu chat
• Exemplo: !randomemote 10 - O bot vai escolher 10 emotes aleatórios do seu chat`;

randomEmoteCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/${randomEmoteCommand.commandName}/${randomEmoteCommand.commandName}.js`;

export { randomEmoteCommand };
