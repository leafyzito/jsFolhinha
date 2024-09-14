const { processCommand } = require("../../utils/processCommand.js");
const { timeSinceDT } = require("../../utils/utils.js");

async function getUserInfo(targetUser) {
    const api_url = `https://api.ivr.fi/v2/twitch/user?login=${targetUser}`;
    const response = await fetch(api_url);
    const data = await response.json();

    if (data === null || data == []) { return null; }

    const displayName = data[0].displayName;
    const userId = data[0].id;
    const chatColor = data[0].chatColor ? data[0].chatColor : 'Nenhuma';
    const badge = data[0].badges.length > 0 ? data[0].badges[0].title : 'Nenhuma';
    const chatterCount = data[0].chatterCount;
    const createdAt = timeSinceDT(data[0].createdAt)[1];
    const howLongAgo = timeSinceDT(data[0].createdAt)[0];
    const followers = data[0].followers;
    const isLive = data[0].stream !== null ? true : false;

    return { displayName, userId, chatColor, badge, chatterCount, createdAt, howLongAgo, followers, isLive };
}

const userCommand = async (client, message) => {
    message.command = 'user';
    if (!await processCommand(5000, 'channel', message, client)) return;

    const userTarget = message.messageText.split(' ')[1]?.replace(/^@/, '').toLowerCase() || message.senderUsername;

    const userInfo = await getUserInfo(userTarget);
    if (!userInfo) {
        client.log.send(message.channelName, `Esse usuário não existe`);
        return;
    }

    client.log.logAndReply(message, `${userInfo.displayName} || ID: ${userInfo.userId} || Cor: ${userInfo.chatColor} || Badge: ${userInfo.badge} || Chatters: ${userInfo.chatterCount} || Seguidores: ${userInfo.followers} || Criado há ${userInfo.howLongAgo} (${userInfo.createdAt}) ${userInfo.isLive ? '|| 🔴 Em live agora' : ''}`);
    return;
};

userCommand.commandName = 'user';
userCommand.aliases = ['user', 'u'];
userCommand.shortDescription = 'Mostra informações gerais sobre um usuário';
userCommand.cooldown = 5000;
userCommand.whisperable = false;
userCommand.description = `Exibe várias informações sobre quem executou o comando ou sobre o usuário fornecido
Informações a serem exibidas: Nick, ID, Cor, Badge, Chatters no canal, Seguidores e Tempo de criação da conta`;
userCommand.code = `https://github.com/leafyzito/jsFolhinha/blob/main/commands/${userCommand.commandName}/${userCommand.commandName}.js`;

module.exports = {
    userCommand,
};
