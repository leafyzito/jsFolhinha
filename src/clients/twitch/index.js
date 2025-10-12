require("dotenv").config();
const { ChatClient } = require("@twurple/chat");
const { ChatClient: DankChatClient } = require("@mastondzn/dank-twitch-irc");
const { getChannelsToJoin } = require("../../utils/init");

//const { modifyClient } = require("../../utils/startup");

// Event handlers (kept in separate files for cleanliness)
const onReadyHandler = require("./events/ready.js");
const onJoinHandler = require("./events/join.js");
const onMessageHandler = require("./events/message.js");
const onTimeout = require("./events/timeout.js");
const onWhisperHandler = require("./events/whisper.js");

class TwitchClient {
  constructor() {
    // https://twurple.js.org/reference/chat/classes/ChatClient.html
    this.client = new ChatClient({
      authProvider: fb.authProvider.provider,
      isAlwaysMod: false,
      logger: { minLevel: "ERROR" },
      rejoinChannelsOnReconnect: true,
      requestMembershipEvents: false,
      //Your bot level (known, verified, or none).
      botLevel: "known",

      //Channels to join after connecting.
      channels: async () =>
        (await getChannelsToJoin()).map((channel) => channel.login),
    });

    this.whisperClient = new DankChatClient({
      username: process.env.BOT_USERNAME,
      password: process.env.BOT_IRC_TOKEN,
      ignoreUnhandledPromiseRejections: true,
    });

    this.anonClient = new ChatClient({
      channels: async () =>
        (await getChannelsToJoin()).map((channel) => channel.login),
      logger: { minLevel: "ERROR" },
      botLevel: "verified",
      readOnly: true,
      rejoinChannelsOnReconnect: true,
      requestMembershipEvents: false,
    });

    // Useful state
    this.client.duplicateMessages = [];

    // Initialize channelsToJoin arrays
    this.anonClient.channelsToJoin = [];

    this.client.IrcSay = this.client.say;
    // Override chat send
    this.client.say = async (
      channelName,
      channelId = null,
      content,
      replyToMessageId = null
    ) => {
      const helixParams = {};
      const ircParams = {};
      if (replyToMessageId) {
        helixParams.replyParentMessageId = replyToMessageId;
        ircParams.replyTo = replyToMessageId;
      }
      // Limit content to 500 characters
      content = content.length > 500 ? content.substring(0, 500) : content;
      if (!channelId) {
        channelId = (await fb.api.helix.getUserByUsername(channelName))?.id;
      }

      // get channel scopes to decide to send using API or IRC
      let channelScopes = [];
      try {
        channelScopes =
          fb.authProvider.provider.getCurrentScopesForUser(channelId);
      } catch {
        // console.log(err);
      }
      let useApi = channelScopes.includes("channel:bot");

      // Try API first, fallback to IRC
      if (useApi) {
        await fb.api.twurple.chat
          .sendChatMessageAsApp(
            process.env.BOT_USERID,
            channelId,
            content,
            helixParams
          )
          .catch(async (err) => {
            console.log(
              `Twitch API message send failed, falling back to IRC: ${err}`
            );
            // await this.client.IrcSay(channelName, content, ircParams);
            useApi = false;
          });
      }

      // Use IRC if API failed or wasn't attempted
      if (!useApi) {
        await this.client.IrcSay(channelName, content, ircParams);
      }

      return { sentVia: useApi ? "api" : "irc" };
    };
  }

  async init() {
    // register events BEFORE connecting
    this.registerEvents();

    // connect
    this.client.connect();
    this.anonClient.connect();
    this.whisperClient.connect();

    this.anonClient.channelsToJoin = (await getChannelsToJoin()).map(
      (channel) => channel.login
    );
  }

  registerEvents() {
    // anon client events (read-only)
    this.anonClient.onConnect(onReadyHandler);
    this.anonClient.onJoin(onJoinHandler);
    this.anonClient.onTimeout(onTimeout);
    this.anonClient.onBan((channel, user) => onTimeout(channel, user, null));
    this.anonClient.onMessage(onMessageHandler);

    // main client whisper (since anon can't receive whispers)
    // this.client.onWhisper(onWhisperHandler);

    // whisper client events
    this.whisperClient.on("WHISPER", (msg) => onWhisperHandler(msg));
  }
}

module.exports = TwitchClient;
