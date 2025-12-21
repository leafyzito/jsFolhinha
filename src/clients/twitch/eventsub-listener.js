require("dotenv").config();
const { EventSubWsListener } = require("@twurple/eventsub-ws");
const { ApiClient } = require("@twurple/api");

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
    if (this.subscribedChannels.has(broadcasterId)) {
      return; // Already subscribed
    }

    try {
      // Subscribe to stream online event (no scopes required)
      this.listener.onStreamOnline(broadcasterId, (event) => {
        this._handleStreamOnline(event);
      });

      // Subscribe to stream offline event (no scopes required)
      this.listener.onStreamOffline(broadcasterId, (event) => {
        this._handleStreamOffline(event);
      });

      // Check if broadcaster token is available for mod/VIP events
      const broadcasterToken = await this._getBroadcasterToken(broadcasterId);
      if (broadcasterToken) {
        // Subscribe to moderator add event (requires moderation:read scope)
        this.listener.onChannelModeratorAdd(broadcasterId, (event) => {
          this._handleModeratorAdd(event);
        });

        // Subscribe to moderator remove event (requires moderation:read scope)
        this.listener.onChannelModeratorRemove(broadcasterId, (event) => {
          this._handleModeratorRemove(event);
        });

        // Subscribe to VIP add event (requires channel:manage:vips scope)
        this.listener.onChannelVipAdd(broadcasterId, (event) => {
          this._handleVipAdd(event);
        });

        // Subscribe to VIP remove event (requires channel:manage:vips scope)
        this.listener.onChannelVipRemove(broadcasterId, (event) => {
          this._handleVipRemove(event);
        });
      } else {
        console.log(
          `* Subscribed to stream events for ${broadcasterId}, but skipping mod/VIP events (broadcaster token not available)`
        );
      }

      this.subscribedChannels.add(broadcasterId);
      console.log(
        `* Subscribed to EventSub events for channel ${broadcasterId}`
      );
    } catch (error) {
      console.error(
        `Error subscribing to EventSub events for ${broadcasterId}:`,
        error
      );
      if (fb.discord && fb.discord.logError) {
        fb.discord.logError(
          `EventSub subscription failed for ${broadcasterId}: ${error.message}`
        );
      }
    }
  }

  async unsubscribeFromChannel(broadcasterId) {
    if (!this.subscribedChannels.has(broadcasterId)) {
      return; // Not subscribed
    }

    try {
      // Note: EventSubWsListener doesn't have explicit unsubscribe methods
      // The subscriptions are tied to the broadcasterId, so we just remove from tracking
      this.subscribedChannels.delete(broadcasterId);
      console.log(
        `* Unsubscribed from EventSub events for channel ${broadcasterId}`
      );
    } catch (error) {
      console.error(
        `Error unsubscribing from EventSub events for ${broadcasterId}:`,
        error
      );
    }
  }

  async checkInitialStatus(broadcasterId) {
    try {
      // Check if broadcaster token is available
      const broadcasterToken = await this._getBroadcasterToken(broadcasterId);
      if (!broadcasterToken) {
        console.log(
          `* Skipping initial status check for ${broadcasterId}: broadcaster token not available`
        );
        return;
      }

      // Check if bot is a moderator
      let botIsMod = false;
      try {
        // Create broadcaster-specific ApiClient to use broadcaster's token
        const broadcasterApiClient = new ApiClient({
          authProvider: fb.authProvider.provider,
          userId: broadcasterId,
        });
        const botUserId = process.env.BOT_USERID;

        // Handle paginated results
        let cursor = null;
        do {
          const result = await broadcasterApiClient.moderation.getModerators(
            broadcasterId,
            { after: cursor }
          );
          if (result && result.data) {
            for (const mod of result.data) {
              if (mod.userId === botUserId) {
                botIsMod = true;
                break;
              }
            }
          }
          if (botIsMod) break;
          cursor = result?.pagination?.cursor || null;
        } while (cursor);
      } catch (error) {
        console.error(
          `Error checking moderator status for ${broadcasterId}:`,
          error
        );
      }

      // Check if bot is a VIP
      let botIsVip = false;
      try {
        // Create broadcaster-specific ApiClient to use broadcaster's token
        const broadcasterApiClient = new ApiClient({
          authProvider: fb.authProvider.provider,
          userId: broadcasterId,
        });
        const botUserId = process.env.BOT_USERID;

        // Handle paginated results - ensure we check all pages
        let cursor = null;
        let hasMorePages = true;
        do {
          const result = await broadcasterApiClient.channels.getVips(
            broadcasterId,
            cursor ? { after: cursor } : {}
          );
          if (result && result.data) {
            for (const vip of result.data) {
              // Check multiple possible property names for user ID
              // VIP objects might have userId, user.id, or id property
              const vipUserId = vip.userId || vip.user?.id || vip.id;
              if (vipUserId === botUserId) {
                botIsVip = true;
                break;
              }
            }
          }
          if (botIsVip) break;
          // Get cursor for next page
          cursor = result?.pagination?.cursor || null;
          hasMorePages = !!cursor;
        } while (hasMorePages);
      } catch (error) {
        console.error(`Error checking VIP status for ${broadcasterId}:`, error);
      }

      // Update config collection
      await fb.db.update(
        "config",
        { channelId: broadcasterId },
        {
          $set: {
            botIsMod: botIsMod,
            botIsVip: botIsVip,
          },
        }
      );

      console.log(
        `* Initial status for ${broadcasterId}: mod=${botIsMod}, vip=${botIsVip}`
      );
    } catch (error) {
      console.error(
        `Error checking initial status for ${broadcasterId}:`,
        error
      );
      if (fb.discord && fb.discord.logError) {
        fb.discord.logError(
          `Initial status check failed for ${broadcasterId}: ${error.message}`
        );
      }
    }
  }

  async _getBroadcasterToken(broadcasterId) {
    try {
      // Check if broadcaster token exists in auth provider
      const scopes =
        fb.authProvider.provider.getCurrentScopesForUser(broadcasterId);
      return scopes && scopes.length > 0;
    } catch {
      return false;
    }
  }

  async _handleStreamOnline(event) {
    try {
      const broadcasterId = event.broadcasterId;
      const broadcasterName = event.broadcasterDisplayName;
      const broadcasterLogin =
        event.broadcasterUserLogin || broadcasterName.toLowerCase();
      const startedAt = event.startedAt
        ? new Date(event.startedAt)
        : new Date();

      // Store live status
      this.liveChannels.set(broadcasterId, {
        channelId: broadcasterId,
        channelName: broadcasterLogin,
        displayName: broadcasterName,
        isLive: true,
        startedAt: startedAt,
      });

      console.log(`* ${broadcasterName} (${broadcasterId}) went live`);

      // Log to Discord if available
      if (fb.discord && fb.discord.log) {
        fb.discord.log(`* ${broadcasterName} went live`);
      }
    } catch (error) {
      console.error("Error handling stream online event:", error);
    }
  }

  async _handleStreamOffline(event) {
    try {
      const broadcasterId = event.broadcasterId;
      const broadcasterName = event.broadcasterDisplayName;

      // Remove live status
      this.liveChannels.delete(broadcasterId);

      console.log(`* ${broadcasterName} (${broadcasterId}) went offline`);

      // Log to Discord if available
      if (fb.discord && fb.discord.log) {
        fb.discord.log(`* ${broadcasterName} went offline`);
      }
    } catch (error) {
      console.error("Error handling stream offline event:", error);
    }
  }

  // Utility method to check if a channel is live
  // Returns live data object if live, null otherwise
  // Can search by channelId or channelName (case-insensitive)
  isChannelLive(channelIdOrName) {
    // Try to find by channelId first
    if (this.liveChannels.has(channelIdOrName)) {
      return this.liveChannels.get(channelIdOrName);
    }

    // Try to find by channel name (case-insensitive)
    const channelNameLower = channelIdOrName.toLowerCase();
    for (const [, liveData] of this.liveChannels.entries()) {
      if (liveData.channelName.toLowerCase() === channelNameLower) {
        return liveData;
      }
    }

    return null;
  }

  // Get all live channels
  getAllLiveChannels() {
    return Array.from(this.liveChannels.values());
  }

  async _handleModeratorAdd(event) {
    try {
      const broadcasterId = event.broadcasterId;
      const userId = event.userId;
      const botUserId = process.env.BOT_USERID;

      // Only update if the bot was added as moderator
      if (userId === botUserId) {
        await fb.db.update(
          "config",
          { channelId: broadcasterId },
          { $set: { botIsMod: true } }
        );

        if (fb.discord && fb.discord.log) {
          fb.discord.log(
            `* Bot was added as moderator in channel ${broadcasterId}`
          );
        }
      }
    } catch (error) {
      console.error("Error handling moderator add event:", error);
    }
  }

  async _handleModeratorRemove(event) {
    try {
      const broadcasterId = event.broadcasterId;
      const userId = event.userId;
      const botUserId = process.env.BOT_USERID;

      // Only update if the bot was removed as moderator
      if (userId === botUserId) {
        await fb.db.update(
          "config",
          { channelId: broadcasterId },
          { $set: { botIsMod: false } }
        );

        if (fb.discord && fb.discord.log) {
          fb.discord.log(
            `* Bot was removed as moderator in channel ${broadcasterId}`
          );
        }
      }
    } catch (error) {
      console.error("Error handling moderator remove event:", error);
    }
  }

  async _handleVipAdd(event) {
    try {
      const broadcasterId = event.broadcasterId;
      const userId = event.userId;
      const botUserId = process.env.BOT_USERID;

      // Only update if the bot was added as VIP
      if (userId === botUserId) {
        await fb.db.update(
          "config",
          { channelId: broadcasterId },
          { $set: { botIsVip: true } }
        );

        console.log(`* Bot was added as VIP in channel ${broadcasterId}`);

        if (fb.discord && fb.discord.log) {
          fb.discord.log(`* Bot was added as VIP in channel ${broadcasterId}`);
        }
      }
    } catch (error) {
      console.error("Error handling VIP add event:", error);
    }
  }

  async _handleVipRemove(event) {
    try {
      const broadcasterId = event.broadcasterId;
      const userId = event.userId;
      const botUserId = process.env.BOT_USERID;

      // Only update if the bot was removed as VIP
      if (userId === botUserId) {
        await fb.db.update(
          "config",
          { channelId: broadcasterId },
          { $set: { botIsVip: false } }
        );

        if (fb.discord && fb.discord.log) {
          fb.discord.log(
            `* Bot was removed as VIP in channel ${broadcasterId}`
          );
        }
      }
    } catch (err) {
      console.error("Error handling VIP remove event:", err);
    }
  }
}

module.exports = EventSubListener;
