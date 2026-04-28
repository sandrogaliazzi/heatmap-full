import newFetch from "../models/newetchWithPppoe.js";
import { listCables } from "./fetchCables.js";
import redis from "../config/redisClient.js";

const TTL = 9000;
const NEWFETCH_CACHE_KEY = "cache:newfetch:v2";

export async function warmUpCache() {
  console.log("[warmUpCache] iniciando aquecimento do cache...");

  try {
    const [newfetchData, cablesData] = await Promise.all([
      newFetch.find({}).exec(),
      listCables(),
    ]);

    await Promise.all([
      redis.setex(NEWFETCH_CACHE_KEY, TTL, JSON.stringify(newfetchData)),
      redis.setex("cache:cables", TTL, JSON.stringify(cablesData)),
    ]);

    console.log("[warmUpCache] cache aquecido com sucesso");
  } catch (err) {
    console.error("[warmUpCache] erro ao aquecer cache:", err.message);
  }
}
