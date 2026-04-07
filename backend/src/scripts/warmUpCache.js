import newFetch from "../models/newetchWithPppoe.js";
import { listCables } from "./fetchCables.js";
import redis from "../config/redisClient.js";

const TTL = 9000;

export async function warmUpCache() {
  console.log("[warmUpCache] iniciando aquecimento do cache...");

  try {
    const [newfetchData, cablesData] = await Promise.all([
      newFetch.find({}, { clients: 0, percentage_free: 0 }).exec(),
      listCables(),
    ]);

    await Promise.all([
      redis.setex("cache:newfetch", TTL, JSON.stringify(newfetchData)),
      redis.setex("cache:cables", TTL, JSON.stringify(cablesData)),
    ]);

    console.log("[warmUpCache] cache aquecido com sucesso");
  } catch (err) {
    console.error("[warmUpCache] erro ao aquecer cache:", err.message);
  }
}
