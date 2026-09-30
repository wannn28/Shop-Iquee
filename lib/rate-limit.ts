type Bucket = { hits: number[] };

const buckets = new Map<string, Bucket>();

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const bucket = buckets.get(key) ?? { hits: [] };
  bucket.hits = bucket.hits.filter((hit) => now - hit < windowMs);
  if (bucket.hits.length >= limit) {
    const retryAfter = Math.max(1, Math.ceil((bucket.hits[0]! + windowMs - now) / 1000));
    buckets.set(key, bucket);
    return { ok: false as const, retryAfter };
  }
  bucket.hits.push(now);
  buckets.set(key, bucket);
  return { ok: true as const, retryAfter: 0 };
}

export function resetRateLimits() {
  buckets.clear();
}

export function clientIp(request: Request) {
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || "unknown";
}
