require("dotenv").config();
const { ChatClient } = require("@mastondzn/dank-twitch-irc");
const { getChannelsToJoin } = require("../../utils/init");

//const { modifyClient } = require("../../utils/startup");

// Event handlers (kept in separate files for cleanliness)
const onReadyHandler = require("./events/ready.js");
const onJoinHandler = require("./events/join.js");
const onMessageHandler = require("./events/message.js");
const onClearChatHandler = require("./events/clearChat.js");
const onWhisperHandler = require("./events/whisper.js");

class TwitchClient {
  constructor() {
    this.client = new ChatClient({
      username: process.env.BOT_USERNAME,
      password: process.env.BOT_IRC_TOKEN,
      ignoreUnhandledPromiseRejections: true,
      maxChannelCountPerConnection: 100,
      connectionRateLimits: {
        parallelConnections: 5,
        releaseTime: 1000,
      },
    });

    this.anonClient = new ChatClient({
      username: "justinfan12345",
      password: undefined,
      rateLimits: "verifiedBot",
      connection: {
        type: "websocket",
        secure: true,
      },
      maxChannelCountPerConnection: 200,
      connectionRateLimits: {
        parallelConnections: 10,
        releaseTime: 100,
      },
      requestMembershipCapability: false,
      installDefaultMixins: false,
      ignoreUnhandledPromiseRejections: true,
    });

    // Useful state
    this.client.duplicateMessages = [];

    // Initialize channelsToJoin arrays
    this.anonClient.channelsToJoin = [];
  }

  async init() {
    // connect
    this.client.connect();
    this.anonClient.connect();

    // register events
    this.registerEvents();

    // get channels to join
    const channelsToJoin = await getChannelsToJoin();

    // join channels
    this.join(channelsToJoin.map((channel) => channel.login));

    // tasks are started from main.js
  }

  registerEvents() {
    // anon client events (read-only)
    this.anonClient.on("ready", () => onReadyHandler());
    this.anonClient.on("JOIN", (channel) => onJoinHandler(channel));
    this.anonClient.on("PRIVMSG", (msg) => onMessageHandler(msg));
    this.anonClient.on("CLEARCHAT", (msg) => onClearChatHandler(msg));

    // main client whisper (since anon can't receive whispers)
    this.client.on("WHISPER", (msg) => onWhisperHandler(msg));
  }

  // join given MULTIPLE channels login names and update channelsToJoin array
  async join(channels = []) {
    if (channels.length === 0) {
      return false;
    }

    // add to channelsToJoin and attempt to join
    this.anonClient.channelsToJoin.push(...channels);
    const joinResult = await this._attemptJoin(channels);

    try {
      // convert usernames to ids for rustlog api
      const users = await fb.api.helix.getManyUsersByUsernames(channels);
      const channelIds = users
        .map((user) => user.id)
        .filter((id) => id !== null);

      // add channel to rustlog using ids
      if (channelIds.length > 0) {
        fb.api.rustlog.addChannel(channelIds);
      }
    } catch (error) {
      console.error("Error converting usernames to IDs:", error);
    }

    return joinResult;
  }

  // helper method to handle the actual joining logic
  async _attemptJoin(channels) {
    try {
      await this.anonClient.joinAll(channels);
      console.log("* Joined channels");
      return true;
    } catch (error) {
      console.log("Error on joining channels:", error);
      return false;
    }
  }

  // part given ONE channel and update channelsToJoin array
  part(channel) {
    // remove from channelsToJoin
    this.anonClient.channelsToJoin = this.anonClient.channelsToJoin.filter(
      (c) => c.toLowerCase() !== channel.toLowerCase()
    );

    // part
    this.anonClient
      .part(channel)
      .catch((error) => console.log("Error on parting channel:", error));
  }
}

module.exports = TwitchClient;
