const express = require("express");
const { createRateLimiter } = require("./rateLimit");

class StatusServer {
  constructor() {
    this.app = express();
    this.port = process.env.STATUS_PORT || 3323;

    // Create rate limiter for status endpoint
    this.rateLimiter = createRateLimiter();

    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    // Apply rate limiting to all routes
    this.app.use(this.rateLimiter.createMiddleware());
  }

  setupRoutes() {
    // Root endpoint with detailed status information
    this.app.get("/", (req, res) => {
      const uptime =
        Math.floor(Date.now() / 1000) - (global.fb?.startTime || 0);

      res.status(200).json({
        status: "running",
        uptime: uptime,
        uptimeHumanized: fb.utils.relativeTime(fb.startTime, true),
        startTime: global.fb?.startTime || null,
        connectedChannels: fb.twitch.anonClient.currentChannels.length || 0,
        channelsToJoin: [...fb.twitch.anonClient.channelsToJoin].length || 0,
      });
    });
  }

  start() {
    this.server = this.app.listen(this.port, "0.0.0.0", () => {
      console.log(`* Status server running on port ${this.port}`);
      console.log(`* Status endpoint: http://0.0.0.0:${this.port}/`);
    });

    // Graceful shutdown
    process.on("SIGTERM", () => this.shutdown());
    process.on("SIGINT", () => this.shutdown());
  }

  shutdown() {
    if (this.server) {
      console.log("* Shutting down status server...");
    }
    // Force exit
    process.exit(0);
  }
}

module.exports = StatusServer;
