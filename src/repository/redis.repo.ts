import { redisClient } from "../config/redis";

const PREFIX = "idempotency:";

export const IdempotencyRepo = {
  async get(key: string) {
    const value = await redisClient.get(PREFIX + key);
    return value ? JSON.parse(value) : null;
  },

  async set(key: string, data: any, ttlSeconds = 600) {
    await redisClient.set(PREFIX + key, JSON.stringify(data), {
      EX: ttlSeconds,
    });
  },
};
