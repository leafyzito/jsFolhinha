require("dotenv").config();
const { EventSubWsListener } = require("@twurple/eventsub-ws");

// Import EventSub modules
const {
  subscribeToChannel: subscribeToChannelHandler,
  unsubscribeFromChannel: unsubscribeFromChannelHandler,
} = require("./subscriptions");
const {
  checkInitialStatus: checkInitialStatusHandler,
} = require("./initial-status-check");
const {
  isChannelLive: isChannelLiveUtil,
  getAllLiveChannels: getAllLiveChannelsUtil,
} = require("./utils");

class EventSubListener {
  constructor() {
    // Initialize EventSubWsListener with the apiClient
    // The apiClient will use tokens from fb.authProvider.provider
    this.listener = new EventSubWsListener({
      apiClient: fb.api.twurple,
    });

    // Track subscribed channels
    this.subscribedChannels = new Set();

    // Track live channels: Map<channelId, { channelName, isLive, startedAt }>
    this.liveChannels = new Map();
  }

  async init() {
    try {
      // Start the EventSub listener
      await this.listener.start();
      console.log("* EventSub listener started");

      // Register event handlers
      this.registerEventHandlers();
    } catch (error) {
      console.error("Error initializing EventSub listener:", error);
      if (fb.discord && fb.discord.logError) {
        fb.discord.logError(
          `EventSub listener initialization failed: ${error.message}`
        );
      }
      throw error;
    }
  }

  registerEventHandlers() {
    // Note: Event handlers are registered per broadcaster when subscribing
    // These are the handler methods that will be called
  }

  async subscribeToChannel(broadcasterId) {
    await subscribeToChannelHandler(
      this.listener,
      this.subscribedChannels,
      this.liveChannels,
      broadcasterId
    );
  }

  async unsubscribeFromChannel(broadcasterId) {
    await unsubscribeFromChannelHandler(this.subscribedChannels, broadcasterId);
  }

  async checkInitialStatus(broadcasterId) {
    await checkInitialStatusHandler(broadcasterId);
  }

  // Utility method to check if a channel is live
  // Returns live data object if live, null otherwise
  // Can search by channelId or channelName (case-insensitive)
  isChannelLive(channelIdOrName) {
    return isChannelLiveUtil(this.liveChannels, channelIdOrName);
  }

  // Get all live channels
  getAllLiveChannels() {
    return getAllLiveChannelsUtil(this.liveChannels);
  }
}

module.exports = EventSubListener;
