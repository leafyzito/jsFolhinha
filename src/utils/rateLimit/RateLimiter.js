/**
 * Rate Limiter Class
 * Simple rate limiting for HTTP requests based on IP addresses
 */

class RateLimiter {
  constructor(config) {
    this.config = config;
    this.requestCounts = new Map();
    this.startCleanupInterval();
  }

  /**
   * Get client IP address from request
   * @param {Object} req - Express request object
   * @returns {string} Client IP address
   */
  getClientIP(req) {
    return (
      req.ip ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      "unknown"
    );
  }

  /**
   * Check if request is within rate limit
   * @param {string} clientIP - Client IP address
   * @returns {Object} Rate limit check result
   */
  checkRateLimit(clientIP) {
    if (!this.requestCounts.has(clientIP)) {
      this.requestCounts.set(clientIP, {
        count: 0,
        resetTime: Date.now() + this.config.windowMs,
      });
    }

    const clientData = this.requestCounts.get(clientIP);

    // Check if window has expired
    if (Date.now() > clientData.resetTime) {
      clientData.count = 0;
      clientData.resetTime = Date.now() + this.config.windowMs;
    }

    // Check if limit exceeded
    if (clientData.count >= this.config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: clientData.resetTime,
        retryAfter: Math.ceil((clientData.resetTime - Date.now()) / 1000),
      };
    }

    // Increment request count
    clientData.count++;

    return {
      allowed: true,
      remaining: this.config.maxRequests - clientData.count,
      resetTime: clientData.resetTime,
      retryAfter: 0,
    };
  }

  /**
   * Get rate limit headers for response
   * @param {Object} checkResult - Result from checkRateLimit
   * @returns {Object} Headers object
   */
  getRateLimitHeaders(checkResult) {
    return {
      "X-RateLimit-Limit": this.config.maxRequests,
      "X-RateLimit-Remaining": checkResult.remaining,
      "X-RateLimit-Reset": Math.ceil(checkResult.resetTime / 1000),
    };
  }

  /**
   * Create Express middleware for rate limiting
   * @returns {Function} Express middleware function
   */
  createMiddleware() {
    return (req, res, next) => {
      const clientIP = this.getClientIP(req);
      const checkResult = this.checkRateLimit(clientIP);

      if (!checkResult.allowed) {
        return res.status(429).json({
          error: "Rate limit exceeded",
          message: this.config.message,
          retryAfter: checkResult.retryAfter,
        });
      }

      // Add rate limit headers
      res.set(this.getRateLimitHeaders(checkResult));
      next();
    };
  }

  /**
   * Start cleanup interval to remove expired entries
   */
  startCleanupInterval() {
    setInterval(() => {
      const now = Date.now();
      for (const [ip, data] of this.requestCounts.entries()) {
        if (now > data.resetTime) {
          this.requestCounts.delete(ip);
        }
      }
    }, 60 * 60 * 1000); // Run every hour
  }
}

module.exports = RateLimiter;
