import { processCommand } from '../../utils/processCommand.js';
import { send7tvPresence } from '../../utils/utils.js';

async function get7tvUserid(twitchUid) {
    const api_url = `https://7tv.io/v3/users/twitch/${twitchUid}`;
    const response = await fetch(api_url);
    const data = await response.json();

    if (data.user) {
        return data.user.id;
    } else {
        return null;
    }
}

const presenceCommand = async (client, message) => {
    message.command = 'presence';
    if (!(await processCommand(5000, 'user', message, client))) return;

    const presenceTarget =
        message.messageText.split(' ')[1]?.replace(/^@/, '') || message.senderUsername;
    const presenceTargetTwitchUid =
        presenceTarget.toLowerCase() != message.senderUsername
            ? await client.getUserID(presenceTarget)
            : message.senderUserID;
    if (!presenceTargetTwitchUid) {
        client.log.logAndReply(message, `Esse usuário não existe`);
        return;
    }
    const sevenTvUserId = await get7tvUserid(presenceTargetTwitchUid);
    if (!sevenTvUserId) {
        client.log.logAndReply(message, `Esse usuário não está registado no 7TV`);
        return;
    }

    await send7tvPresence(message, sevenTvUserId, true);

    const emote = await client.emotes.getEmoteFromList(
        message.channelName,
        ['joia', 'jumilhao'],
        'FeelsOkayMan 👍'
    );
    client.log.logAndReply(
        message,
        `(7TV) Presence ${presenceTarget != message.senderUsername ? `de ${presenceTarget}` : ''} atualizada ${emote}`
    );
};

presenceCommand.commandName = 'presence';
presenceCommand.aliases = ['presence'];
presenceCommand.shortDescription = 'Atualiza a sua presença no 7tv';
presenceCommand.cooldown = 5000;
presenceCommand.whisperable = false;
presenceCommand.description = `Use este comando para atualizar a sua presença no 7tv, ou seja, atualizar a sua paint ou badge caso não tenha atualizado automaticamente corretamente
Pode também fornecer um usuário para atualizar a sua presença, caso queira atualizar a presença de outro usuário

Se você não sabe o que isso significa, este comando provavelmente não será útil para você`;
presenceCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/${presenceCommand.commandName}/${presenceCommand.commandName}.js`;

export { presenceCommand };
