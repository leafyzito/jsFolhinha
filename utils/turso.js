const { createClient } = require("@libsql/client");

const tursoClient = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});


// create class with diverse commands like get, insert, update, delete
class TursoUtils {
    constructor() {
        this.client = tursoClient;
    }

    async logMessage(message) {
        // user VARCHAR(255) NOT NULL,
        // userid VARCHAR(255) NOT NULL,
        // channel VARCHAR(255) NOT NULL,
        // channelid VARCHAR(255) NOT NULL,
        // isStreamer BOOLEAN NOT NULL,
        // isMod BOOLEAN NOT NULL,
        // isVip BOOLEAN NOT NULL,
        // isFirstMsg BOOLEAN NOT NULL,
        // content TEXT NOT NULL,
        // date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        // rawBadges VARCHAR(255)

        this.client.execute({
            sql: `INSERT INTO messagelog (user, userid, channel, channelid, isStreamer, isMod, isVip, isFirstMsg, content, date, rawBadges, messageid) 
                                VALUES (:user, :userid, :channel, :channelid, :isStreamer, :isMod, :isVip, :isFirstMsg, :content, :date, :rawBadges, :messageid)`,
            args: {
                user: message.senderUsername, // string
                userid: message.senderUserID, // string
                channel: message.channelName, // string
                channelid: message.channelID, // string
                isStreamer: message.isStreamer, // boolean
                isMod: message.isMod, // boolean
                isVip: message.isVip, // boolean
                isFirstMsg: message.isFirstMsg, // boolean
                content: message.messageText, // string
                date: message.serverTimestampRaw, // date
                rawBadges: message.badgesRaw, // string
                messageid: message.messageID // string
            }
        }).catch((error) => {
            console.log('Error on logMessage:', error);
        });
    }
}

module.exports = {
    TursoUtils: TursoUtils,
};