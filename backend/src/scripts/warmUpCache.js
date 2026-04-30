import newFetch from "../models/newetchWithPppoe.js";
import { listCables } from "./fetchCables.js";
import { getAllClients as fetchAllClients } from "./fetchApiTomodat.js";
import redis from "../config/redisClient.js";

const TTL = 9000;
const CLIENTS_CACHE_TTL = 600;
const NEWFETCH_CACHE_KEY = "cache:newfetch:v3";
const CLIENTS_CACHE_KEY = "cache:tomodat:clients:v2";

export async function warmUpCache() {
  console.log("[warmUpCache] iniciando aquecimento do cache...");

  try {
    const [newfetchData, cablesData] = await Promise.all([
      newFetch.find({}, { clients: 0 }).exec(),
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

export async function warmUpClientsCache() {
  console.log("[warmUpClientsCache] iniciando aquecimento do cache de clientes...");

  try {
    const clientsData = await fetchAllClients();

    await redis.setex(
      CLIENTS_CACHE_KEY,
      CLIENTS_CACHE_TTL,
      JSON.stringify(clientsData)
    );

    console.log("[warmUpClientsCache] cache de clientes aquecido com sucesso");
  } catch (err) {
    console.error(
      "[warmUpClientsCache] erro ao aquecer cache de clientes:",
      err.message
    );
  }
}
