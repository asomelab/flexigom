/**
 * Simple in-process rate limiter for the create-preference endpoint.
 * Limits: 10 requests per IP per minute (configurable via env).
 * Note: resets on process restart — suitable for single-process deployment (Railway).
 */

const ipWindows = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = Number(process.env.MP_PREFERENCE_RATE_LIMIT) || 10;

// Prune expired entries periodically to avoid unbounded growth
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of ipWindows.entries()) {
    if (now > record.resetAt) ipWindows.delete(ip);
  }
}, 5 * 60 * 1000);

export default () => async (ctx: any, next: () => Promise<void>) => {
  const ip =
    (ctx.request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    ctx.request.ip ||
    'unknown';

  const now = Date.now();
  const record = ipWindows.get(ip);

  if (!record || now > record.resetAt) {
    ipWindows.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return next();
  }

  if (record.count >= MAX_REQUESTS) {
    ctx.status = 429;
    ctx.body = { error: 'Too Many Requests', message: 'Retry after 60 seconds' };
    ctx.set('Retry-After', '60');
    return;
  }

  record.count++;
  return next();
};
