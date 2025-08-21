// <reference path="./types/global.d.ts" />
require("dotenv").config();

// IMPORTS
const { fetchData } = require("./src/utils/gotWrapper");
const { loadCommands } = require("./src/commands/commandsList");
const { loadReminders } = require("./src/handlers/listener/reminder");

// GLOBAL FB OBJECT SETUP
// Initialize fb object first, before any other modules
// This makes fb available globally (fb.*) and also as global.fb.*
global.fb = global.fb || {};
const fb = global.fb;

// Ensure fb is available globally for all modules
global.fb = fb;

// Add custom got function to fb
fb.got = fetchData;

// FB PROPERTIES INITIALIZATION
// Add initialization status tracking
fb.isReady = false;
fb.startTime = Math.floor(Date.now() / 1000);
fb.readyCallbacks = [];

// Initialize all fb properties upfront so they're available globally from the start
fb.utils = null;
fb.emotes = null;
fb.db = null;
fb.log = null;
fb.api = {};
fb.twitch = null;
fb.discord = null;

// FB UTILITY FUNCTIONS
// Function to mark fb as ready
fb.markReady = () => {
  fb.isReady = true;
  fb.readyCallbacks.forEach((callback) => callback());
  fb.readyCallbacks = [];
};

// MAIN INITIALIZATION FUNCTION
async function initializeApp() {
  try {
    console.log("* Starting application initialization...");

    // Initialize all utility instances first
    const { utils, emotes, db, log } =
      await require("./src/utils/init").initializeUtilities();
    fb.utils = utils;
    fb.emotes = emotes;
    fb.db = db;
    fb.log = log;
    console.log("* Utilities initialized");

    // Initialize APIs
    fb.api = await require("./src/utils/init").initializeAPIs();
    console.log("* APIs initialized");

    // Initialize clients
    fb.discord = await require("./src/utils/init").initializeDiscord();
    console.log("* Discord client initialized");

    fb.twitch = await require("./src/utils/init").initializeTwitch();
    console.log("* Twitch client initialized");

    // Load commands
    loadCommands();
    console.log("* Commands loaded");

    // Load and process reminders (handle missed and schedule future ones)
    await loadReminders();
    console.log("* Reminders loaded and processed");

    // Mark fb as ready
    fb.markReady = true;
    console.log("* fb object is now ready");

    // Start recurring tasks
    const { startAllTasks } = require("./src/tasks/index");
    startAllTasks();

    // Start status server
    const StatusServer = require("./src/utils/statusServer");
    fb.statusServer = new StatusServer();
    fb.statusServer.start();

    console.log("* Application initialization complete!");
  } catch (error) {
    console.error("Failed to initialize application:", error);
    process.exit(1);
  }
}

// Start the initialization process
initializeApp();

module.exports = { fb };
