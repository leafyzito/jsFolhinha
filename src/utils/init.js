// Initialization utilities for the application

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

async function initializeAPIs() {
  const allApis = require("../apis/index");
  return {
    ...Object.fromEntries(
      Object.entries(allApis).map(([key, Api]) => [key, new Api()])
    ),
  };
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

  // If not in production, return dev test channel
  if (process.env.ENV !== "prod") {
    const devTestChannel = process.env.DEV_TEST_CHANNEL;
    const devTestChannelInfo = await fb.api.helix.getUserByUsername(
      devTestChannel
    );
    return [devTestChannelInfo];
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

module.exports = {
  initializeUtilities,
  initializeAPIs,
  initializeDiscord,
  initializeTwitch,
  getChannelsToJoin,
};
