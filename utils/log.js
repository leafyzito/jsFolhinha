class Logger {
    constructor(client) {
        this.client = client;
    }

    async logAndReply(message, response) {
        this.client.reply(message.channelName, message.messageID, response)
            .catch((err) => {
                if (err.message.includes('identical to the previous one')) {
                    console.log('sending identical message error, ending here');
                } else if (err.message.includes('too quickly')) {
                    console.log('sending messages too quickly error, retrying');
                    setTimeout(() => { this.send(message.channelName, response); }, 1500);
                } else {
                    console.log('logAndReply error: ', err);
                }
            });

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
        this.client.say(message.channelName, response)
            .catch((err) => {
                if (err.message.includes('identical to the previous one')) {
                    console.log('sending identical message error, ending here');
                } else if (err.message.includes('too quickly')) {
                    console.log('sending messages too quickly error, retrying');
                    setTimeout(() => { this.logAndSay(message, response); }, 1500);
                } else {
                    console.log('logAndSay error: ', err);
                }
            });

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
        this.client.me(message.channelName, response)
            .catch((err) => {
                if (err.message.includes('identical to the previous one')) {
                    console.log('sending identical message error, ending here');
                } else if (err.message.includes('too quickly')) {
                    console.log('sending messages too quickly error, retrying');
                    setTimeout(() => { this.logAndMeAction(message, response); }, 1500);
                } else {
                    console.log('logAndMeAction error: ', err);
                }
            });

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

    async send(channel, content) {
        this.client.say(channel, content)
            .catch((err) => {
                if (err.message.includes('identical to the previous one')) {
                    console.log('sending identical message error, ending here');
                }
                else if (err.message.includes('too quickly')) {
                    console.log('sending messages too quickly error, retrying');
                    setTimeout(() => { this.send(channel, content); }, 1500);
                } else {
                    console.log('send error: ', err);
                }
            });
    }
}

module.exports = {
    Logger: Logger
};
