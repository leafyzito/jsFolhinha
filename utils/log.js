const { CreateRegex } = require('./Regex.js');

const regex = new CreateRegex();

class Logger {
    constructor(client) {
        this.client = client;
    }

    async logAndReply(message, response) {
        if (regex.check(response, response.split(' '), message.channelName)) {
            console.log(`* Caught by regex in #${message.channelName}/${[message.senderUsername]} - original response: ${response}`);
            this.client.discord.log(`* Caught by regex in #${message.channelName}/${[message.senderUsername]} - original response: ${response}`);
            this.send(process.env.DEV_TEST_CHANNEL, 'Regex apanhado, check logs @leafyzito');
            response = '⚠️ Mensagem retida por conter conteúdo banido, tente novamente ou mude um pouco o comando'
        }

        message.responseTime = new Date().getTime() - message.serverTimestampRaw;
        this.client.reply(message.channelName, message.messageID, response)
            .catch((err) => {
                if (err.message.includes('identical to the previous one')) {
                    console.log('sending identical message error, ending here');
                } else if (err.message.includes('too quickly')) {
                    console.log('sending messages too quickly error, retrying');
                    setTimeout(() => { this.send(message.channelName, response); }, 1500);
                } else if (err.message.includes('waiting for response')) {
                    console.log('waiting for response error, retrying');
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

        // console.log(insertDoc);
        // console.log('command log is off');
        this.client.discord.logCommand(message, response);
        if (!message.command.includes('dev')) { await this.client.db.insert('commandlog', insertDoc); }
        console.log(`#${message.channelName}/${message.senderUsername} - ${message.command}`);
    }

    async logAndSay(message, response) {
        if (regex.check(response, response.split(' '), message.channelName)) {
            console.log(`* Caught by regex - original response: ${response}`);
            this.client.discord.log(`* Caught by regex - original response: ${response}`);
            this.send(process.env.DEV_TEST_CHANNEL, 'Regex apanhado, check logs @leafyzito');
            response = '⚠️ Mensagem retida por conter conteúdo banido, tente novamente ou mude um pouco o comando'
        }

        message.responseTime = new Date().getTime() - message.serverTimestampRaw;
        this.client.say(message.channelName, response)
            .catch((err) => {
                if (err.message.includes('identical to the previous one')) {
                    console.log('sending identical message error, ending here');
                } else if (err.message.includes('too quickly')) {
                    console.log('sending messages too quickly error, retrying');
                    setTimeout(() => { this.logAndSay(message, response); }, 1500);
                } else if (err.message.includes('waiting for response')) {
                    console.log('waiting for response error, retrying');
                    setTimeout(() => { this.send(message.channelName, content); }, 1500);
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

        // console.log(insertDoc);
        // console.log('command log is off');
        this.client.discord.logCommand(message, response);
        if (!message.command.includes('dev')) { await this.client.db.insert('commandlog', insertDoc); }
        console.log(`#${message.channelName}/${message.senderUsername} - ${message.command}`);
    }

    async logAndMeAction(message, response) {
        if (regex.check(response, response.split(' '), message.channelName)) {
            console.log(`* Caught by regex - original response: ${response}`);
            this.client.discord.log(`* Caught by regex - original response: ${response}`);
            this.send(process.env.DEV_TEST_CHANNEL, 'Regex apanhado, check logs @leafyzito');
            response = '⚠️ Mensagem retida por conter conteúdo banido, tente novamente ou mude um pouco o comando'
        }

        message.responseTime = new Date().getTime() - message.serverTimestampRaw;
        this.client.me(message.channelName, response)
            .catch((err) => {
                if (err.message.includes('identical to the previous one')) {
                    console.log('sending identical message error, ending here');
                } else if (err.message.includes('too quickly')) {
                    console.log('sending messages too quickly error, retrying');
                    setTimeout(() => { this.logAndMeAction(message, response); }, 1500);
                } else if (err.message.includes('waiting for response')) {
                    console.log('waiting for response error, retrying');
                    setTimeout(() => { this.send(message.channelName, content); }, 1500);
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

        // console.log(insertDoc);
        // console.log('command log is off');
        this.client.discord.logCommand(message, response);
        if (!message.command.includes('dev')) { await this.client.db.insert('commandlog', insertDoc); }
        console.log(`#${message.channelName}/${message.senderUsername} - ${message.command}`);
    }

    async logAndWhisper(message, response) {
        if (regex.check(response, response.split(' '), message.senderUsername)) {
            console.log(`* Caught by regex - original response: ${response}`);
            this.client.discord.log(`* Caught by regex - original response: ${response}`);
            return;
        }

        this.client.whisper(message.senderUsername, response);
        this.client.discord.logWhisper(message.senderUsername, response);
    }

    async send(channel, content) {
        if (regex.check(content, content.split(' '), `By Folhinha to ${channel}`)) {
            console.log(`* Caught by regex - original content: ${content}`);
            this.client.discord.log(`* Caught by regex - original content: ${content}`);
            this.send(process.env.DEV_TEST_CHANNEL, 'Regex apanhado, check logs @leafyzito');
            content = '⚠️ Mensagem retida por conter conteúdo banido, tente novamente ou mude um pouco o comando'
        }

        this.client.say(channel, content)
            .catch((err) => {
                if (err.message.includes('identical to the previous one')) {
                    console.log('sending identical message error, ending here');
                }
                else if (err.message.includes('too quickly')) {
                    console.log('sending messages too quickly error, retrying');
                    setTimeout(() => { this.send(channel, content); }, 1500);
                } else if (err.message.includes('waiting for response')) {
                    console.log('waiting for response error, retrying');
                    setTimeout(() => { this.send(channel, content); }, 1500);
                } else {
                    console.log('send error: ', err);
                }
            });
        this.client.discord.logSend(channel, content);
    }
}

module.exports = {
    Logger: Logger
};
