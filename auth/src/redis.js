const { createClient } = require("redis");

const redisUrl = `redis://${process.env.REDIS_HOST || "redis"}:6379`;
const redis = createClient({ url: redisUrl });
redis.on("error", (err) => {
  console.error("Redis error", err);
});

async function ensureRedis() {
  if (!redis.isOpen) {
    await redis.connect();
  }
}

module.exports = { redis, ensureRedis };
