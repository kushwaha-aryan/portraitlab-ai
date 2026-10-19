/**
 * Minimal in-memory sliding-window rate limiter.
 *
 * Suitable for local development and single-process demos only. It is NOT
 * production-grade: state is lost on restart and is not shared across
 * multiple server instances or serverless invocations.
 */

const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 6;

interface Bucket {
  timestamps: number[];
}

const globalStore = globalThis as unknown as {
  __portraitlabRateLimitBuckets?: Map<string, Bucket>;
};

function getStore(): Map<string, Bucket> {
  if (!globalStore.__portraitlabRateLimitBuckets) {
    globalStore.__portraitlabRateLimitBuckets = new Map();
  }
  return globalStore.__portraitlabRateLimitBuckets;
}

export function getClientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return "local";
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function checkRateLimit(
  key: string,
  options: { windowMs?: number; max?: number; now?: number } = {},
): RateLimitResult {
  const windowMs = options.windowMs ?? WINDOW_MS;
  const max = options.max ?? MAX_REQUESTS;
  const now = options.now ?? Date.now();
  const store = getStore();

  const bucket = store.get(key) ?? { timestamps: [] };
  const recent = bucket.timestamps.filter((ts) => now - ts < windowMs);

  if (recent.length >= max) {
    const oldest = recent[0] ?? now;
    const retryAfterMs = Math.max(oldest + windowMs - now, 1000);
    store.set(key, { timestamps: recent });
    return {
      ok: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil(retryAfterMs / 1000),
    };
  }

  recent.push(now);
  store.set(key, { timestamps: recent });

  if (store.size > 10_000) {
    for (const [k, b] of store) {
      if (b.timestamps.every((ts) => now - ts >= windowMs)) {
        store.delete(k);
      }
    }
  }

  return {
    ok: true,
    remaining: max - recent.length,
    retryAfterSeconds: 0,
  };
}
