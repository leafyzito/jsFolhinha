/**
 * Rate Limiting Module
 * Simple rate limiting for basic spam prevention
 */

const createRateLimiter = require("./factory");
const config = require("./config");

module.exports = {
  createRateLimiter,
  config,
};
