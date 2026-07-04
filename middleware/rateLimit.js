const buckets = new Map();

export function turnCredentialRateLimit(req, res, next) {
  const windowMs = 60_000;
  const limit = Number.parseInt(process.env.TURN_RATE_LIMIT_PER_MINUTE || "10", 10);
  const key = req.turnSession.id;
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return next();
  }
  if (bucket.count >= limit) {
    res.set({ "Cache-Control": "no-store", "Retry-After": String(Math.ceil((bucket.resetAt - now) / 1000)) });
    return res.status(429).json({ error: "Too many TURN credential requests" });
  }
  bucket.count += 1;
  next();
}
