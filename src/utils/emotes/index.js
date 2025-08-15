class Emotes {
  constructor() {
    this.cachedEmotes = {};
    this.sadEmotes = ["sadge", "sadgecry", "sadcat", "sadchamp"];
    this.happyEmotes = [
      "peepoglad",
      "gladge",
      "peepohappy",
      "peepohappyu",
      "happycat",
    ];
    this.pogEmotes = [
      "pog",
      "pogu",
      "pagbounce",
      "pogg",
      "pogs",
      "noway",
      "nowaying",
      "nowaycat",
      "eba",
    ];
  }

  async get7tv(channelId) {
    try {
      const sevenTvEmotes = [];
      const url = `https://7tv.io/v3/users/twitch/${channelId}`;
      const response = await fb.request(url);

      if (response.statusCode !== 200) {
        return sevenTvEmotes;
      }

      const data = await response.body.json();

      if (data.error_code === 404) {
        return sevenTvEmotes;
      }

      if (data.emote_set === null || data.emote_set === undefined) {
        return sevenTvEmotes;
      }

      return data.emote_set.emotes.map((emote) => emote.name);
    } catch (err) {
      console.log(`* Error fetching 7tv emotes for ${channelId}: ${err}`);
      fb.discord.logError(`Error fetching 7tv emotes for ${channelId}: ${err}`);
      return [];
    }
  }

  async getBttv(channelId) {
    try {
      const bttvEmotes = [];
      const url = `https://api.betterttv.net/3/cached/users/twitch/${channelId}`;
      const response = await fb.request(url);
      const data = await response.body.json();

      if (response.statusCode !== 200) {
        return bttvEmotes;
      }

      return [...data.channelEmotes, ...data.sharedEmotes].map(
        (emote) => emote.code
      );
    } catch (err) {
      console.log(`* Error fetching bttv emotes for ${channelId}: ${err}`);
      fb.discord.logError(
        `Error fetching bttv emotes for ${channelId}: ${err}`
      );
      return [];
    }
  }

  async getFfz(channelId) {
    try {
      const ffzEmotes = [];
      const url = `https://api.frankerfacez.com/v1/room/id/${channelId}`;
      const response = await fb.request(url);
      const data = await response.body.json();

      if (response.statusCode !== 200) {
        return ffzEmotes;
      }

      const setId = data.room.set;
      return data.sets[setId].emoticons.map((emote) => emote.name);
    } catch (err) {
      console.log(`* Error fetching bttv emotes for ${channelId}: ${err}`);
      fb.discord.logError(
        `Error fetching bttv emotes for ${channelId}: ${err}`
      );
      return [];
    }
  }

  async getEmotes(channelId, channelName) {
    const ttv = await this.get7tv(channelId).catch(() => []);
    const bttv = await this.getBttv(channelId).catch(() => []);
    const ffz = await this.getFfz(channelId).catch(() => []);

    const channelEmotes = ttv.concat(bttv, ffz);
    this.cachedEmotes[channelName] = channelEmotes;
    return channelEmotes;
  }

  async getChannelEmotes(channelName) {
    if (!this.cachedEmotes[channelName]) {
      console.log(`* Fetching emotes for ${channelName}`);
      fb.discord.log(`* Fetching emotes for ${channelName}`);
      const channelId = (await fb.api.helix.getUserByUsername(channelName))?.id;
      if (!channelId) {
        return [];
      }
      return this.getEmotes(channelId, channelName);
    }

    return this.cachedEmotes[channelName];
  }

  async getEmoteFromList(channelName, emoteList, defaultResponse = "") {
    if (channelName === "whisper") {
      return defaultResponse;
    }
    const channelEmotes = await this.getChannelEmotes(channelName);
    const possibleEmotes = [];
    emoteList.forEach((emote) => {
      const lowercaseEmote = emote.toLowerCase();
      const originalCaseEmote = channelEmotes.find(
        (channelEmote) => channelEmote.toLowerCase() === lowercaseEmote
      );
      if (originalCaseEmote) {
        possibleEmotes.push(originalCaseEmote);
      }
    });

    return fb.utils.randomChoice(possibleEmotes) || defaultResponse;
  }
}

module.exports = Emotes;
