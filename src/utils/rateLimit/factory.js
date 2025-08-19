/**
 * Rate Limiter Factory
 * Simple factory for creating rate limiters
 */

const RateLimiter = require("./RateLimiter");
const config = require("./config");

/**
 * Create a simple rate limiter for basic spam prevention
 * @returns {RateLimiter} Rate limiter instance
 */
function createRateLimiter() {
  return new RateLimiter(config);
}

module.exports = createRateLimiter;
