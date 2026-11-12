import Redis from "ioredis";
import { env } from "./envConfig";

// Fail fast on dead Redis: 5 s connect timeout, a few quick reconnect
// attempts, then stop retrying so boot fails instead of retry-spamming
// forever (ioredis retries indefinitely by default).
const redis = new Redis(env.REDIS_URL, {
  connectTimeout: 5000,
  maxRetriesPerRequest: 2,
  retryStrategy: (times) =>
    times > 3 ? null : Math.min(times * 200, 1000),
});

redis.on("connect", () => {
  console.log("Redis connected");
});

redis.on("ready", () => {
  console.log("Redis ready");
});

redis.on("error", (err) => {
  console.error("Redis error:", err.message);
});

export default redis;
