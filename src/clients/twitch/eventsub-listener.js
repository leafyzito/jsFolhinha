require("dotenv").config();
const { EventSubWsListener } = require("@twurple/eventsub-ws");
const { ApiClient } = require("@twurple/api");

// Import event handlers
const handleStreamOnline = require("./eventsub-events/stream-online");
const handleStreamOffline = require("./eventsub-events/stream-offline");
const handleModeratorAdd = require("./eventsub-events/moderator-add");
const handleModeratorRemove = require("./eventsub-events/moderator-remove");
const handleVipAdd = require("./eventsub-events/vip-add");
const handleVipRemove = require("./eventsub-events/vip-remove");
const handleChannelFollow = require("./eventsub-events/channel-follow");
const handleChannelSubscription = require("./eventsub-events/channel-subscription");
const handleChannelSubscriptionGift = require("./eventsub-events/channel-subscription-gift");

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
        handleStreamOnline(event, this.liveChannels);
      });

      // Subscribe to stream offline event (no scopes required)
      this.listener.onStreamOffline(broadcasterId, (event) => {
        handleStreamOffline(event, this.liveChannels);
      });

      // Check if broadcaster token is available for mod/VIP events
      const broadcasterToken = await this._getBroadcasterToken(broadcasterId);

      if (broadcasterToken) {
        // Subscribe to moderator events (requires moderation:read scope)
        const hasModScope = await this._hasScope(
          broadcasterId,
          "moderation:read"
        );
        if (hasModScope) {
          try {
            this.listener.onChannelModeratorAdd(broadcasterId, (event) => {
              handleModeratorAdd(event);
            });

            this.listener.onChannelModeratorRemove(broadcasterId, (event) => {
              handleModeratorRemove(event);
            });
          } catch (error) {
            console.error(
              `Error subscribing to moderator events for ${broadcasterId}:`,
              error
            );
          }
        }

        // Subscribe to VIP events (requires channel:manage:vips scope)
        const hasVipManageScope = await this._hasScope(
          broadcasterId,
          "channel:manage:vips"
        );
        if (hasVipManageScope) {
          try {
            this.listener.onChannelVipAdd(broadcasterId, (event) => {
              handleVipAdd(event);
            });

            this.listener.onChannelVipRemove(broadcasterId, (event) => {
              handleVipRemove(event);
            });
          } catch (error) {
            console.error(
              `Error subscribing to VIP events for ${broadcasterId}:`,
              error
            );
          }
        }

        // Subscribe to follower events (requires moderator:read:followers scope)
        try {
          const hasFollowerScope = await this._hasScope(
            broadcasterId,
            "moderator:read:followers"
          );

          if (hasFollowerScope) {
            // If broadcaster authorized the app, use broadcaster's ID for both fields
            // (streamers are moderators of their own channel)
            this.listener.onChannelFollow(
              broadcasterId,
              broadcasterId,
              (event) => {
                handleChannelFollow(event);
              }
            );
          } else {
            // Otherwise, check if bot is a moderator and use bot's user ID
            const channelConfig = await fb.db.get("config", {
              channelId: broadcasterId,
            });
            const botIsMod = channelConfig?.botIsMod === true;
            const botUserId = process.env.BOT_USERID;

            if (botIsMod && botUserId) {
              this.listener.onChannelFollow(
                broadcasterId,
                botUserId,
                (event) => {
                  handleChannelFollow(event);
                }
              );
            }
          }
        } catch (error) {
          console.error(
            `Error subscribing to follower events for ${broadcasterId}:`,
            error
          );
        }

        // Subscribe to subscription events (requires channel:read:subscriptions scope)
        try {
          const hasSubscriptionScope = await this._hasScope(
            broadcasterId,
            "channel:read:subscriptions"
          );

          if (hasSubscriptionScope) {
            // Subscribe to new subscriptions
            this.listener.onChannelSubscription(broadcasterId, (event) => {
              handleChannelSubscription(event);
            });

            // Subscribe to resubscriptions (with messages)
            this.listener.onChannelSubscriptionMessage(
              broadcasterId,
              (event) => {
                handleChannelSubscription(event);
              }
            );

            // Subscribe to gifted subscriptions
            this.listener.onChannelSubscriptionGift(broadcasterId, (event) => {
              handleChannelSubscriptionGift(event);
            });
          }
        } catch (error) {
          console.error(
            `Error subscribing to subscription events for ${broadcasterId}:`,
            error
          );
        }
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
        // Set botIsMod and botIsVip to false as default when token is not available
        await fb.db.update(
          "config",
          { channelId: broadcasterId },
          {
            $set: {
              botIsMod: false,
              botIsVip: false,
            },
          }
        );
        return;
      }

      // Check if bot is a moderator
      let botIsMod = false;
      const hasModScope = await this._hasScope(
        broadcasterId,
        "moderation:read"
      );

      if (hasModScope) {
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

          // Fallback: If bot not found in moderator list, check using bot's own token
          // This uses the user:read:moderated_channels scope to check from bot's perspective
          if (!botIsMod && hasModScope) {
            try {
              const botHasModeratedChannelsScope = await this._hasScope(
                botUserId,
                "user:read:moderated_channels"
              );

              if (botHasModeratedChannelsScope) {
                // Create bot-specific ApiClient to use bot's token
                const botApiClient = new ApiClient({
                  authProvider: fb.authProvider.provider,
                  userId: botUserId,
                });

                // Check if broadcaster's channel is in bot's moderated channels
                let cursor = null;
                do {
                  const result =
                    await botApiClient.moderation.getModeratedChannels(
                      botUserId,
                      {
                        after: cursor,
                      }
                    );

                  if (result && result.data) {
                    for (const channel of result.data) {
                      // Check multiple possible property names for broadcaster ID
                      const channelBroadcasterId =
                        channel.broadcasterId ||
                        channel.broadcaster_id ||
                        channel.id ||
                        channel.userId ||
                        channel.user_id;

                      if (
                        channelBroadcasterId === broadcasterId ||
                        String(channelBroadcasterId) === String(broadcasterId)
                      ) {
                        botIsMod = true;
                        break;
                      }
                    }
                  }
                  if (botIsMod) break;
                  cursor = result?.pagination?.cursor || null;
                } while (cursor);
              }

              // Final fallback: If broadcaster has moderation:read scope and bot still not found,
              // assume bot is mod (broadcaster authorized bot with mod permissions)
              if (!botIsMod && hasModScope) {
                botIsMod = true;
              }
            } catch (error) {
              console.error(
                `Error in fallback moderator check for ${broadcasterId}:`,
                error
              );
            }
          }
        } catch (error) {
          console.error(
            `Error checking moderator status for ${broadcasterId}:`,
            error
          );
        }
      }

      // Check if bot is a VIP
      let botIsVip = false;
      const hasVipReadScope = await this._hasScope(
        broadcasterId,
        "channel:read:vips"
      );

      if (hasVipReadScope) {
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
          console.error(
            `Error checking VIP status for ${broadcasterId}:`,
            error
          );
        }
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

  async _hasScope(broadcasterId, requiredScope) {
    try {
      const scopes =
        fb.authProvider.provider.getCurrentScopesForUser(broadcasterId);
      return scopes && scopes.includes(requiredScope);
    } catch {
      return false;
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
}

module.exports = EventSubListener;
