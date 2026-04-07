import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  retryStrategy(times) {
    return Math.min(times * 100, 3000);
  },
  maxRetriesPerRequest: null,
  lazyConnect: false,
});

redis.on("connect", () => console.log("[Redis] conectado"));
redis.on("error", (err) => console.error("[Redis] erro:", err.message));

export async function getOrSetCache(key, ttlSeconds, fetchFn) {
  try {
    const cached = await redis.get(key);
    if (cached !== null) {
      return JSON.parse(cached);
    }
  } catch (err) {
    console.error(`[Redis] falha ao ler chave ${key}:`, err.message);
    return fetchFn();
  }

  const data = await fetchFn();

  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(data));
  } catch (err) {
    console.error(`[Redis] falha ao gravar chave ${key}:`, err.message);
  }

  return data;
}

export default redis;
