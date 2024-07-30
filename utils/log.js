const { MongoUtils } = require('./mongo');


async function logAndReply(client, message, response) {
    client.reply(message.channelName, message.messageID, response);

    const currentDate = new Date();
    const formattedDate = currentDate.toISOString().replace('T', ' ').substr(0, 19);
    // console.log(formattedDate);

    // log into commandlog
    const mongoUtils = new MongoUtils();
    const insertDoc = {
        messageid: message.messageID,
        sentDate: formattedDate,
        channel: message.channelName,
        channelId: message.channelID,
        user: message.senderUsername,
        userId: message.senderUserID,
        command: message.command,
        content: message.messageText,
        response: response
    };
    // await mongoUtils.insert('commandlog', insertDoc);
    console.log(insertDoc);
    console.log('command log is off');
    console.log(`#${message.channelName}/${message.senderUsername} - ${message.command}`);
    return;
}

async function logAndSay(client, message, response) {
    client.say(message.channelName, response);

    const currentDate = new Date();
    const formattedDate = currentDate.toISOString().replace('T', ' ').substr(0, 19);
    // console.log(formattedDate);

    // log into commandlog
    const mongoUtils = new MongoUtils();
    const insertDoc = {
        messageid: message.messageID,
        sentDate: formattedDate,
        channel: message.channelName,
        channelId: message.channelID,
        user: message.senderUsername,
        userId: message.senderUserID,
        command: message.command,
        content: message.messageText,
        response: response
    };
    // await mongoUtils.insert('commandlog', insertDoc);
    console.log(insertDoc);
    console.log('command log is off');
    console.log(`#${message.channelName}/${message.senderUsername} - ${message.command}`);
    return;
}

async function logAndMeAction(client, message, response) {
    client.me(message.channelName, response);

    const currentDate = new Date();
    const formattedDate = currentDate.toISOString().replace('T', ' ').substr(0, 19);
    // console.log(formattedDate);

    // log into commandlog
    const mongoUtils = new MongoUtils();
    const insertDoc = {
        messageid: message.messageID,
        sentDate: formattedDate,
        channel: message.channelName,
        channelId: message.channelID,
        user: message.senderUsername,
        userId: message.senderUserID,
        command: message.command,
        content: message.messageText,
        response: `/me ${response}`
    };
    // await mongoUtils.insert('commandlog', insertDoc);
    console.log(insertDoc);
    console.log('command log is off');
    console.log(`#${message.channelName}/${message.senderUsername} - ${message.command}`);
    return;
}


module.exports = {
    logAndReply: logAndReply,
    logAndSay: logAndSay,
    logAndMeAction: logAndMeAction
};