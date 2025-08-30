require("dotenv").config();
const { ChatClient } = require("@twurple/chat");
const { getChannelsToJoin } = require("../../utils/init");

//const { modifyClient } = require("../../utils/startup");

// Event handlers (kept in separate files for cleanliness)
const onReadyHandler = require("./events/ready.js");
const onJoinHandler = require("./events/join.js");
const onMessageHandler = require("./events/message.js");
const onTimeout = require("./events/timeout.js");
// const onWhisperHandler = require("./events/whisper.js");

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
      //botLevel: none,

      //Channels to join after connecting.
      //channels: [],
    });

    this.anonClient = new ChatClient({
      channels: async () =>
        (await getChannelsToJoin()).map((channel) => channel.login),
      logger: { minLevel: "ERROR" },
      readOnly: true,
      rejoinChannelsOnReconnect: true,
      requestMembershipEvents: false,
    });

    // Useful state
    this.client.duplicateMessages = [];

    // Initialize channelsToJoin arrays
    this.anonClient.channelsToJoin = [];

    this.client.originalSay = this.client.say;
    // Override chat send
    this.client.say = async (
      channelName,
      channelId = null,
      content,
      replyToMessageId = null
    ) => {
      let useApi = true;
      const helixParams = {};
      const ircParams = {};
      if (replyToMessageId) {
        helixParams.replyParentMessageId = replyToMessageId;
        ircParams.replyTo = replyToMessageId;
      }
      const texts = splitOnSpaces(content, 500);
      if (!channelId) {
        channelId = (await fb.api.twurple.users.getUserByName(channelName)).id;
      }

      // Try API first, fallback to IRC on per-message basis
      for (const msg of texts) {
        if (useApi) {
          try {
            await fb.api.twurple.chat.sendChatMessageAsApp(
              process.env.BOT_USERID,
              channelId,
              msg,
              helixParams
            );
            // await fb.discord.log(`[Twitch API] #${channel}: ${msg}`);
            continue; // Success, continue with API
          } catch (err) {
            console.warn(
              `API failed for ${channelName}, switching to IRC:`,
              err
            );
            useApi = false;
            console.error(`API failed for ${channelName}:`, err);
            throw err; // Re-throw unexpected errors
          }
        }

        // (fallback) IRC send message
        try {
          await this.client.originalSay(channelName, msg, ircParams);
          // await fb.discord.log(`[Twitch IRC] #${channel}: ${msg}`);
        } catch (error) {
          console.error(`IRC failed for ${channelName}, message lost:`, error);
        }
      }

      return useApi;
    };
  }

  async init() {
    // connect
    this.client.connect();
    this.anonClient.connect();

    // register events
    this.registerEvents();

    this.anonClient.channelsToJoin = (await getChannelsToJoin()).map(
      (channel) => channel.login
    );

    // tasks are started from main.js
  }

  registerEvents() {
    // anon client events (read-only)
    this.anonClient.onConnect(() => onReadyHandler());
    this.anonClient.onJoin((channel) => onJoinHandler(channel));
    this.anonClient.onTimeout((msg) => onTimeout(msg));
    this.anonClient.onBan((msg) => onTimeout(msg, true));
    this.anonClient.onMessage(onMessageHandler);

    // main client whisper (since anon can't receive whispers)
    // this.client.on("WHISPER", (msg) => onWhisperHandler(msg));
  }

  // join given MULTIPLE channels login names and update channelsToJoin array
  join(channels = []) {
    if (channels.length === 0) {
      return false;
    }

    // add to channelsToJoin
    this.anonClient.channelsToJoin.push(...channels);

    // join
    this.anonClient
      .joinAll(channels)
      .then(() => console.log("* Joined channels"))
      .catch((error) => {
        console.log("Error on joining channels:", error);
        return false;
      });

    return true;
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

function splitOnSpaces(text, maxMsgLength) {
  text = text.trim();
  const isMe = text.startsWith("/me ");
  const mePrefix = isMe ? "/me " : "";
  const prefixLength = mePrefix.length;

  if (text.length <= maxMsgLength) {
    return [text];
  }

  const res = [];
  let startIndex = 0;

  // If /me, skip the prefix for splitting, but add it to each slice
  const splitText = isMe ? text.slice(prefixLength) : text;

  while (startIndex < splitText.length) {
    const availableLength = maxMsgLength - prefixLength;
    const endIndex = startIndex + availableLength;
    let spaceIndex = splitText.lastIndexOf(" ", endIndex);

    if (
      spaceIndex === -1 ||
      spaceIndex <= startIndex ||
      splitText.length - startIndex <= availableLength
    ) {
      spaceIndex = Math.min(startIndex + availableLength, splitText.length);
    }

    const textSlice = splitText.slice(startIndex, spaceIndex).trim();
    if (textSlice.length) {
      res.push(mePrefix + textSlice);
    }

    startIndex = spaceIndex + (splitText[spaceIndex] === " " ? 1 : 0);
  }

  return res;
}

module.exports = TwitchClient;
