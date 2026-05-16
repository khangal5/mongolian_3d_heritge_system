import { config } from "../config/env.js";
import { logger } from "./logger.js";

const cacheLogger = logger.child({ module: "cache" });

let redis = null;
let connectionAttempted = false;
let connectionFailed = false;

async function getClient() {
  if (!config.redisUrl) return null;
  if (redis) return redis;
  if (connectionFailed) return null;
  if (connectionAttempted) return redis;

  connectionAttempted = true;
  try {
    const { default: Redis } = await import("ioredis");
    redis = new Redis(config.redisUrl, {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      lazyConnect: false
    });
    redis.on("error", (error) => {
      cacheLogger.warn({ err: error }, "Redis алдаа");
    });
    cacheLogger.info("Redis client холбогдсон");
  } catch (error) {
    connectionFailed = true;
    cacheLogger.warn({ err: error }, "Redis ачаалагдсангүй — cache идэвхгүй");
    redis = null;
  }
  return redis;
}

export async function cacheGet(key) {
  const client = await getClient();
  if (!client) return null;
  try {
    const value = await client.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    cacheLogger.warn({ err: error, key }, "cacheGet алдаа");
    return null;
  }
}

export async function cacheSet(key, value, ttlSeconds = config.cacheTtlSeconds) {
  const client = await getClient();
  if (!client) return;
  try {
    await client.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch (error) {
    cacheLogger.warn({ err: error, key }, "cacheSet алдаа");
  }
}

export async function cacheDelete(pattern) {
  const client = await getClient();
  if (!client) return;
  try {
    if (pattern.includes("*")) {
      const stream = client.scanStream({ match: pattern, count: 100 });
      const keys = [];
      for await (const batch of stream) {
        keys.push(...batch);
      }
      if (keys.length) {
        await client.del(...keys);
      }
    } else {
      await client.del(pattern);
    }
  } catch (error) {
    cacheLogger.warn({ err: error, pattern }, "cacheDelete алдаа");
  }
}

export async function cacheWrap(key, ttlSeconds, fetcher) {
  const cached = await cacheGet(key);
  if (cached !== null) return cached;
  const fresh = await fetcher();
  if (fresh !== undefined && fresh !== null) {
    await cacheSet(key, fresh, ttlSeconds);
  }
  return fresh;
}

export async function closeCacheConnection() {
  if (redis) {
    await redis.quit().catch(() => {});
    redis = null;
  }
}
