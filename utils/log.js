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

    handleSendError(err, channel, content, retryMethod, retryCount = 0, lastResortWhisperTarger = null) {
        // console.log('handleSendError: ', err);

        // Handle identical message error - no retries needed
        if (err.cause.message.includes('identical to the previous one')) {
            console.log('sending identical message error, ending here');
        }

        // Check if we've hit max retries
        if (retryCount >= 3) {
            // send whisper to user as last resort
            if (lastResortWhisperTarger) {
                console.log('Max retries reached, whispering response to user');
                this.client.discord.log(`* Dropped message in #${channel}, whispering response to ${lastResortWhisperTarger}: ${content}`);
                this.client.whisper(lastResortWhisperTarger, content);
                return;
            }
            console.log('Max retries reached, dropping message');
            this.client.discord.log(`* Dropped message in #${channel}: ${content}`);
            return;
        }

        // Handle retryable errors
        const isRetryableError = err.cause.message.includes('too quickly') || err.cause.message.includes('waiting for response');
        const errorType = err.cause.message.includes('too quickly') ? 'sending messages too quickly' : 'waiting for response';

        if (isRetryableError) {
            console.log(`${errorType} error, retrying (${retryCount + 1}/3)`);
            setTimeout(() => { retryMethod(channel, content, retryCount + 1, lastResortWhisperTarger); }, 1500);
            return;
        }

        // Handle any other errors
        console.log('send error: ', err);
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

    async logAndReply(message, response, notes = null, retryCount = 0) {
        message.notes = notes;
        response = this.checkRegexAndHandle(response, message.channelName, message);

        message.responseTime = new Date().getTime() - message.serverTimestampRaw;
        message.internalResponseTime = new Date().getTime() - message.internalTimestamp;

        if (message.channelName == 'whisper') {
            this.client.whisper(message.senderUsername, response);
        } else {
            await this.manageChannelMsgCooldown(message.channelName);
            this.client.reply(message.channelName, message.messageID, response)
                .catch((err) => this.handleSendError(err,
                    message.channelName,
                    response,
                    (channel, content, retryCount, senderUsername) => this.send(channel, content, retryCount, senderUsername),
                    retryCount,
                    message.senderUsername
                ));
        }

        await this.createCommandLog(message, response);
        console.log(`#${message.channelName}/${message.senderUsername} - ${message.command}`);
    }

    async logAndSay(message, response, notes = null, retryCount = 0) {
        message.notes = notes;
        response = this.checkRegexAndHandle(response, message.channelName, message);

        message.responseTime = new Date().getTime() - message.serverTimestampRaw;
        message.internalResponseTime = new Date().getTime() - message.internalTimestamp;

        await this.manageChannelMsgCooldown(message.channelName);
        this.client.say(message.channelName, response)
            .catch((err) => this.handleSendError(
                err,
                message.channelName,
                response,
                (channel, content, retryCount, senderUsername) => this.send(channel, content, retryCount, senderUsername),
                retryCount,
                message.senderUsername
            ));

        await this.createCommandLog(message, response);
        console.log(`#${message.channelName}/${message.senderUsername} - ${message.command}`);
    }

    async logAndMeAction(message, response, notes = null, retryCount = 0) {
        message.notes = notes;
        response = this.checkRegexAndHandle(response, message.channelName, message);

        message.responseTime = new Date().getTime() - message.serverTimestampRaw;
        message.internalResponseTime = new Date().getTime() - message.internalTimestamp;

        await this.manageChannelMsgCooldown(message.channelName);
        this.client.me(message.channelName, response)
            .catch((err) => this.handleSendError(err,
                message.channelName,
                response,
                (channel, content, retryCount, senderUsername) => this.send(channel, content, retryCount, senderUsername), retryCount,
                message.senderUsername
            ));

        await this.createCommandLog(message, '/me ' + response);
        console.log(`#${message.channelName}/${message.senderUsername} - ${message.command}`);
    }

    async logAndWhisper(message, response, notes = null) {
        message.notes = notes;
        response = this.checkRegexAndHandle(response, message.senderUsername, message);

        this.client.whisper(message.senderUsername, response);
        this.client.discord.logWhisper(message.senderUsername, response);
    }

    async send(channel, content, retryCount = 0, senderUsername = null) {
        content = this.checkRegexAndHandle(content, channel);

        await this.manageChannelMsgCooldown(channel);
        this.client.say(channel, content)
            .catch((err) => this.handleSendError(err,
                channel,
                content,
                (channel, content, retryCount, senderUsername) => this.send(channel, content, retryCount, senderUsername),
                retryCount,
                senderUsername
            ));

        this.client.discord.logSend(channel, content);
    }

    async reply(message, response, retryCount = 0) {
        response = this.checkRegexAndHandle(response, message.channelName, message);

        await this.manageChannelMsgCooldown(message.channelName);
        this.client.reply(message.channelName, message.messageID, response)
            .catch((err) => this.handleSendError(err,
                message.channelName,
                response,
                (channel, content, retryCount, senderUsername) => this.send(channel, content, retryCount, senderUsername),
                retryCount,
                message.senderUsername
            ));

        this.client.discord.logSend(message.channelName, response);
    }

    async whisper(targetUser, content, retryCount = 0) {
        content = this.checkRegexAndHandle(content, targetUser);

        this.client.whisper(targetUser, content)
            .catch((err) => this.handleSendError(err,
                targetUser,
                content,
                this.whisper.bind(this),
                retryCount,
                null
            ));

        this.client.discord.logWhisper(targetUser, content);
    }
}

module.exports = {
    Logger: Logger
};
