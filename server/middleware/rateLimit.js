// Fixed-window in-memory rate limiter keyed by IP (+ optional user id). Good enough for a single-node deploy.
import { config } from '../config.js';
import { tooMany } from '../utils/errors.js';

const buckets = new Map();

function keyFor(req, scope) {
  const ip = req.ip || req.socket?.remoteAddress || 'unknown';
  const user = req.user?.id ? `u:${req.user.id}` : '';
  return `${scope}|${ip}|${user}`;
}

export function rateLimit(scope, limit) {
  const windowMs = config.rateLimit.windowMs;
  return (req, _res, next) => {
    const key = keyFor(req, scope);
    const now = Date.now();
    let bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }
    bucket.count += 1;
    if (bucket.count > limit) {
      return next(tooMany());
    }
    next();
  };
}

// Sweep stale buckets so the map does not grow forever.
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}, config.rateLimit.windowMs).unref();

export const generalLimiter = rateLimit('general', config.rateLimit.general);
export const aiLimiter = rateLimit('ai', config.rateLimit.ai);
export const authLimiter = rateLimit('auth', config.rateLimit.auth);
