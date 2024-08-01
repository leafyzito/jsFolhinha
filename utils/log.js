class Logger {
    constructor(client) {
        this.client = client;
    }

    async logAndReply(message, response) {
        this.client.reply(message.channelName, message.messageID, response);

        const currentDate = new Date();
        const formattedDate = currentDate.toISOString().replace('T', ' ').substr(0, 19);

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

        console.log(insertDoc);
        console.log('command log is off');
        console.log(`#${message.channelName}/${message.senderUsername} - ${message.command}`);
    }

    async logAndSay(message, response) {
        this.client.say(message.channelName, response);

        const currentDate = new Date();
        const formattedDate = currentDate.toISOString().replace('T', ' ').substr(0, 19);

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

        console.log(insertDoc);
        console.log('command log is off');
        console.log(`#${message.channelName}/${message.senderUsername} - ${message.command}`);
    }

    async logAndMeAction(message, response) {
        this.client.me(message.channelName, response);

        const currentDate = new Date();
        const formattedDate = currentDate.toISOString().replace('T', ' ').substr(0, 19);

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

        console.log(insertDoc);
        console.log('command log is off');
        console.log(`#${message.channelName}/${message.senderUsername} - ${message.command}`);
    }
}

module.exports = {
    Logger: Logger
};
