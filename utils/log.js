const { CreateRegex } = require('./Regex.js');

const regex = new CreateRegex();

class Logger {
    constructor(client) {
        this.client = client;
        this.channelMsgCooldowns = new Map(); // Track last message timestamp per channel
    }

    async manageChannelMsgCooldown(channel) {
        const now = Date.now();
        const lastMessageTime = this.channelMsgCooldowns.get(channel) || 0;
        const timeSinceLastMessage = now - lastMessageTime;

        if (timeSinceLastMessage < 2000) { // 2 seconds cooldown
            await new Promise(resolve => setTimeout(resolve, 2000 - timeSinceLastMessage));
        }

        this.channelMsgCooldowns.set(channel, Date.now());
    }

    checkRegexAndHandle(content, channelContext, message = null) {
        const result = regex.check(content, content.split(' '), channelContext);
        if (result.caught) {
            console.log(`* Caught by ${result.caughtCategory} (${result.matchedWord}) - original content: ${content}`);
            this.client.discord.importantLog(`* Caught by ${result.caughtCategory} (${result.matchedWord}) - original content: ${content}`);
            // this.send(process.env.DEV_TEST_CHANNEL, `Regex apanhado, check logs ${process.env.DEV_NICK}`);
            if (message) {
                if (!message.notes) message.notes = '';
                message.notes = message.notes + `Caught by: ${result.caughtCategory} (${result.matchedWord}) - Original content: ${content}`;
            }
            content = '⚠️ Mensagem retida por conter conteúdo banido, tente novamente ou mude um pouco o comando';
        }
        return content;
    }

    async createCommandLog(message, response) {
        const insertDoc = {
            messageid: message.messageID,
            sentDate: message.serverTimestamp,
            channel: message.channelName,
            channelId: message.channelID || null,
            user: message.senderUsername,
            userId: message.senderUserID,
            command: message.command,
            content: message.messageText,
            response: response,
            notes: message.notes || null,
        };

        this.client.discord.logCommand(message, response);
        if (!message.command.includes('dev') && process.env.ENV == 'prod') {
            await this.client.db.insert('commandlog', insertDoc);
        }
    }

    async logAndReply(message, response, notes = null) {
        message.notes = notes;
        response = this.checkRegexAndHandle(response, message.channelName, message);

        message.responseTime = new Date().getTime() - message.serverTimestampRaw;
        message.internalResponseTime = new Date().getTime() - message.internalTimestamp;

        if (message.channelName == 'whisper') {
            this.client.whisper(message.senderUsername, response);
        } else {
            await this.manageChannelMsgCooldown(message.channelName);
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
        }

        await this.createCommandLog(message, response);
        console.log(`#${message.channelName}/${message.senderUsername} - ${message.command}`);
    }

    async logAndSay(message, response, notes = null) {
        message.notes = notes;
        response = this.checkRegexAndHandle(response, message.channelName, message);

        message.responseTime = new Date().getTime() - message.serverTimestampRaw;
        message.internalResponseTime = new Date().getTime() - message.internalTimestamp;

        await this.manageChannelMsgCooldown(message.channelName);
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

        await this.createCommandLog(message, response);
        console.log(`#${message.channelName}/${message.senderUsername} - ${message.command}`);
    }

    async logAndMeAction(message, response, notes = null) {
        message.notes = notes;
        response = this.checkRegexAndHandle(response, message.channelName, message);

        message.responseTime = new Date().getTime() - message.serverTimestampRaw;
        message.internalResponseTime = new Date().getTime() - message.internalTimestamp;

        await this.manageChannelMsgCooldown(message.channelName);
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

        await this.createCommandLog(message, '/me ' + response);
        console.log(`#${message.channelName}/${message.senderUsername} - ${message.command}`);
    }

    async logAndWhisper(message, response, notes = null) {
        message.notes = notes;
        response = this.checkRegexAndHandle(response, message.senderUsername, message);

        this.client.whisper(message.senderUsername, response);
        this.client.discord.logWhisper(message.senderUsername, response);
    }

    async send(channel, content) {
        content = this.checkRegexAndHandle(content, channel);

        await this.manageChannelMsgCooldown(channel);
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

    async reply(message, response) {
        response = this.checkRegexAndHandle(response, message.channelName, message);

        await this.manageChannelMsgCooldown(message.channelName);
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

        this.client.discord.logSend(message.channelName, response);
    }

    async whisper(targetUser, content) {
        content = this.checkRegexAndHandle(content, targetUser);

        this.client.whisper(targetUser, content)
            .catch((err) => {
                if (err.message.includes('identical to the previous one')) {
                    console.log('sending identical message error, ending here');
                }
                else if (err.message.includes('too quickly')) {
                    console.log('sending messages too quickly error, retrying');
                    setTimeout(() => { this.whisper(targetUser, content); }, 1500);
                } else if (err.message.includes('waiting for response')) {
                    console.log('waiting for response error, retrying');
                    setTimeout(() => { this.whisper(targetUser, content); }, 1500);
                } else {
                    console.log('whisper error: ', err);
                }
            });
        this.client.discord.logWhisper(targetUser, content);
    }
}

module.exports = {
    Logger: Logger
};
