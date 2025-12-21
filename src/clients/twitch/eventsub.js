require("dotenv").config();

const { EventSubWsListener } = require("@twurple/eventsub-ws");
const { getChannelsToJoin } = require("../../utils/init");

class TwitchEventSub {
  constructor() {
    this.listener = new EventSubWsListener({
      apiClient: fb.api.twurple,
      logger: { minLevel: "ERROR" },
    });

    /**
     * Map key: `${type}:${broadcasterId}` -> EventSubSubscription
     * (We keep references mostly to avoid double subscribing.)
     */
    this.subscriptions = new Map();
  }

  async init() {
    this.registerEvents();
    this.listener.start();

    // Subscribe for all channels we join on startup (when possible).
    await this.syncFromChannelsToJoin();
  }

  registerEvents() {
    this.listener.onUserSocketConnect((userId) => {
      console.log(`* EventSub WS connected for userId: ${userId}`);
    });

    this.listener.onUserSocketDisconnect((userId, error) => {
      console.log(
        `* EventSub WS disconnected for userId: ${userId}${
          error ? ` (${error.message})` : ""
        }`
      );
    });

    this.listener.onSubscriptionCreateSuccess((sub, apiSub) => {
      console.log(
        `* EventSub subscription created: ${apiSub.type} for ${apiSub.condition?.broadcaster_user_id || "unknown"}`
      );
      // keep discord noise low; console is enough for now
      void sub;
    });

    this.listener.onSubscriptionCreateFailure((sub, error) => {
      console.error(`* EventSub subscription create failed: ${error.message}`);
      void sub;
    });

    this.listener.onRevoke((sub, status) => {
      console.error(`* EventSub subscription revoked: ${status}`);
      void sub;
    });
  }

  getScopesForBroadcaster(broadcasterId) {
    try {
      const scopes = fb.authProvider.provider.getCurrentScopesForUser(
        broadcasterId
      );
      return Array.isArray(scopes) ? scopes : [];
    } catch {
      return [];
    }
  }

  async syncFromChannelsToJoin() {
    const channels = await getChannelsToJoin();
    for (const channel of channels) {
      await this.subscribeForChannel(channel.id, channel.login);
    }
  }

  async subscribeForChannel(broadcasterId, broadcasterLogin = null) {
    if (!broadcasterId) return;

    // We can only subscribe "when possible": i.e. when we have a stored user token for that broadcaster.
    const scopes = this.getScopesForBroadcaster(broadcasterId);
    if (!scopes.length) {
      if (broadcasterLogin) {
        console.log(
          `* EventSub: skipping ${broadcasterLogin} (${broadcasterId}) - no auth token in 'auth' collection`
        );
      }
      return;
    }

    // Stream online/offline (no scopes required, but still requires broadcaster auth token in this setup).
    this.ensureSub(`stream.online:${broadcasterId}`, () =>
      this.listener.onStreamOnline(broadcasterId, (event) =>
        this.handleStreamOnline(event)
      )
    );
    this.ensureSub(`stream.offline:${broadcasterId}`, () =>
      this.listener.onStreamOffline(broadcasterId, (event) =>
        this.handleStreamOffline(event)
      )
    );

    // Moderator add/remove requires `moderation:read` on the broadcaster token.
    if (scopes.includes("moderation:read")) {
      this.ensureSub(`channel.moderator.add:${broadcasterId}`, () =>
        this.listener.onChannelModeratorAdd(broadcasterId, (event) =>
          this.handleModeratorAdd(event)
        )
      );
      this.ensureSub(`channel.moderator.remove:${broadcasterId}`, () =>
        this.listener.onChannelModeratorRemove(broadcasterId, (event) =>
          this.handleModeratorRemove(event)
        )
      );
    } else if (broadcasterLogin) {
      console.log(
        `* EventSub: ${broadcasterLogin} (${broadcasterId}) missing scope moderation:read; skipping mod add/remove listeners`
      );
    }
  }

  ensureSub(key, createFn) {
    if (this.subscriptions.has(key)) return;
    try {
      const sub = createFn();
      this.subscriptions.set(key, sub);
    } catch (error) {
      console.error(`* EventSub: failed subscribing ${key}: ${error.message}`);
    }
  }

  async handleStreamOnline(event) {
    try {
      let extra = "";
      const stream = await event.getStream().catch(() => null);
      if (stream) {
        const title = stream.title ? ` | ${stream.title}` : "";
        const game = stream.gameName ? ` | ${stream.gameName}` : "";
        extra = `${title}${game}`;
      }

      const msg = `Stream online: ${event.broadcasterDisplayName}${extra}`;
      console.log(`* ${msg}`);
      fb.discord?.importantLog && (await fb.discord.importantLog(msg));
    } catch (error) {
      console.error("* EventSub handleStreamOnline error:", error);
    }
  }

  async handleStreamOffline(event) {
    try {
      const msg = `Stream offline: ${event.broadcasterDisplayName}`;
      console.log(`* ${msg}`);
      fb.discord?.importantLog && (await fb.discord.importantLog(msg));
    } catch (error) {
      console.error("* EventSub handleStreamOffline error:", error);
    }
  }

  async handleModeratorAdd(event) {
    try {
      const msg = `Moderator added in ${event.broadcasterDisplayName}: ${event.userDisplayName}`;
      console.log(`* ${msg}`);
      fb.discord?.importantLog && (await fb.discord.importantLog(msg));
    } catch (error) {
      console.error("* EventSub handleModeratorAdd error:", error);
    }
  }

  async handleModeratorRemove(event) {
    try {
      const msg = `Moderator removed in ${event.broadcasterDisplayName}: ${event.userDisplayName}`;
      console.log(`* ${msg}`);
      fb.discord?.importantLog && (await fb.discord.importantLog(msg));
    } catch (error) {
      console.error("* EventSub handleModeratorRemove error:", error);
    }
  }
}

module.exports = TwitchEventSub;

