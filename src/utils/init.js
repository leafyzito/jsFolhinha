// Initialization utilities for the application
const { ApiClient } = require("@twurple/api");

async function initializeUtilities() {
  const Utils = require("./utils/index");
  const Emotes = require("./emotes/index");
  const MongoUtils = require("../db/index");
  const Logger = require("../log/index");

  const utils = new Utils();
  const emotes = new Emotes();
  const db = new MongoUtils();
  const log = new Logger();

  return { utils, emotes, db, log };
}
async function initializeAuthProvider() {
  const AuthProvider = require("../clients/twitch/authProvider");
  const authProvider = new AuthProvider();
  await authProvider.init();
  return authProvider;
}

async function initializeAPIs() {
  const allApis = require("../apis/index");
  return {
    ...Object.fromEntries(
      Object.entries(allApis).map(([key, Api]) => [key, new Api()])
    ),
  };
}

async function initializeApiClient() {
  const apiClient = new ApiClient({ authProvider: fb.authProvider.provider });
  return apiClient;
}

async function initializeDiscord() {
  const DiscordClient = require("../clients/discord");
  const discord = new DiscordClient();
  await discord.init();
  return discord;
}

async function initializeTwitch() {
  const TwitchClient = require("../clients/twitch");
  const twitch = new TwitchClient();
  await twitch.init();
  return twitch;
}

async function getChannelsToJoin() {
  // Ensure fb object is available
  if (!fb || !fb.api || !fb.api.helix || !fb.db) {
    throw new Error("fb object not properly initialized");
  }

  // If not in production, return dev test channels
  if (process.env.ENV !== "prod") {
    const devTestChannels = process.env.DEV_TEST_CHANNELS.split(",")
      .map((channel) => channel.trim())
      .filter((channel) => channel);

    if (devTestChannels.length === 0) {
      return [];
    }

    // Get channel info for each dev test channel
    const devTestChannelsInfo = [];
    for (const channel of devTestChannels) {
      const channelInfo = await fb.api.helix.getUserByUsername(channel);
      if (channelInfo) {
        devTestChannelsInfo.push(channelInfo);
      }
    }

    return devTestChannelsInfo;
  }

  try {
    // Get channel IDs from database (use cache for initialization)
    const configs = await fb.db.get("config", {});
    const channelIdsToJoin = configs.map((channel) => channel.channelId);

    // Get channel names from user IDs using the helix API
    const channelsToJoin = await fb.api.helix.getManyUsersByUserIDs(
      channelIdsToJoin
    );

    return channelsToJoin || [];
  } catch (error) {
    console.error("Error getting channels to join:", error);
    return [];
  }
}

async function getTokenData() {
  try {
    // Ensure fb object is available
    if (!fb || !fb.db) {
      throw new Error("fb object not properly initialized");
    }

    // Get all auth tokens from the database
    const authTokens = await fb.db.get("auth", {});

    // Map database fields to the format expected by addUsers method
    return authTokens.map((token) => ({
      userId: token.user_id,
      username: token.username,
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      scope: token.scope,
      expiresIn: token.expires_at
        ? Math.floor((new Date(token.expires_at) - new Date()) / 1000)
        : null,
      obtainmentTimestamp: token.created_at
        ? Math.floor(new Date(token.created_at).getTime() / 1000)
        : null,
    }));
  } catch (error) {
    console.error("Error fetching token data from database:", error);
    return [];
  }
}

module.exports = {
  initializeUtilities,
  initializeAPIs,
  initializeApiClient,
  initializeDiscord,
  initializeAuthProvider,
  initializeTwitch,
  getChannelsToJoin,
  getTokenData,
};
