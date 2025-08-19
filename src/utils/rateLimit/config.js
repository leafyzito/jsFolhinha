/**
 * Rate Limiting Configuration
 * Simple configuration for basic spam prevention
 */

module.exports = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // Maximum 100 requests per window
  message: "Too many requests from this IP, please try again later.",
};
