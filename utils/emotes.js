const { randomChoice } = require('./utils.js');
const fetch = require('node-fetch');

class Emotes {
    constructor(client) {
        this.client = client;
        this.cachedEmotes = {};
    }

    async getTtv(channelId) {
        var sevenTvEmotes = [];
        const url = `https://7tv.io/v3/users/twitch/${channelId}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.error_code === 404) {
            return sevenTvEmotes;
        }

        return data.emote_set.emotes.map(emote => emote.name);
    }

    async getBttv(channelId) {
        var bttvEmotes = [];
        const url = `https://api.betterttv.net/3/cached/users/twitch/${channelId}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.message) {
            return bttvEmotes;
        }

        return data.channelEmotes.map(emote => emote.code);
    }

    async getFfz(channelId) {
        var ffzEmotes = [];
        const url = `https://api.frankerfacez.com/v1/room/id/${channelId}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.status === 404) {
            return ffzEmotes;
        }

        const setId = data.room.set;
        return data.sets[setId].emoticons.map(emote => emote.name);
    }

    async getEmotes(channelId, channelName) {
        const ttv = await this.getTtv(channelId).catch(() => []);
        const bttv = await this.getBttv(channelId).catch(() => []);
        const ffz = await this.getFfz(channelId).catch(() => []);

        const channelEmotes = ttv.concat(bttv, ffz);
        this.cachedEmotes[channelName] = channelEmotes;
        return channelEmotes;
    }

    async getChannelEmotes(channelName) {
        if (!this.cachedEmotes[channelName]) {
            console.log(`* Fetching emotes for ${channelName}`);
            const channelId = await this.client.getUserID(channelName);
            if (!channelId) { return []; }
            return this.getEmotes(channelId, channelName);
        }

        return this.cachedEmotes[channelName];
    }

    async getEmoteFromList(channelName, emoteList, defaultResponse = '') {
        var channelEmotes = await this.getChannelEmotes(channelName);
        var possibleEmotes = [];
        emoteList.forEach((emote) => {
            const lowercaseEmote = emote.toLowerCase();
            const originalCaseEmote = channelEmotes.find(channelEmote => channelEmote.toLowerCase() === lowercaseEmote);
            if (originalCaseEmote) {
                possibleEmotes.push(originalCaseEmote);
            }
        });
        
        return randomChoice(possibleEmotes) || defaultResponse;
    }

}

module.exports = {
    Emotes
};
