// Minimal in-memory fixed-window limiter. Good enough for a single-instance
// deployment or this assessment; a real production deployment behind
// multiple instances should swap this for a shared store (e.g. Redis /
// Upstash) so limits are enforced across processes.
type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number }
): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterMs: 0 };
  }

  if (bucket.count >= limit) {
    return { allowed: false, retryAfterMs: bucket.resetAt - now };
  }

  bucket.count += 1;
  return { allowed: true, retryAfterMs: 0 };
}

export function clientKeyFromRequest(req: Request, scope: string): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim() ?? "unknown";
  return `${scope}:${ip}`;
}
