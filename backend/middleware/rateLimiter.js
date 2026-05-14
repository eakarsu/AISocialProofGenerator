const rateLimit = require('express-rate-limit');

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts, please try again later.' }
});

// Stricter AI rate limiter: 10 req/hour keyed by user
const aiRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false, keyGeneratorIpFallback: false },
  keyGenerator: (req) => {
    if (req.user) return 'user:' + (req.user.id || req.user.userId);
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    return ip.replace(/^::ffff:/, '');
  },
  message: { error: 'Too many AI requests. Limit: 10 per hour.' }
});

module.exports = { generalLimiter, authLimiter, aiRateLimiter };
