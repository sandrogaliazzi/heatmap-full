import app from "./src/app.js";
import http from "http";
import cron from "node-cron";
import signalUpdateLoop from "./src/scripts/uploadSignals.js";
import tomodatUpdateLoop from "./src/scripts/updateFetch.js";
import deleteReservados from "./src/scripts/deleteReservados.js";
import { warmUpCache, warmUpClientsCache } from "./src/scripts/warmUpCache.js";

const port = process.env.PORT || 5005; //always 5005

const server = http.createServer(app);

if (process.env.NODE_ENV === "production") {
  signalUpdateLoop();
  tomodatUpdateLoop();
  deleteReservados();
  cron.schedule("0 */2 * * *", warmUpCache);
  cron.schedule("*/5 * * * *", warmUpClientsCache);
  warmUpCache();
  warmUpClientsCache();
}

server.listen(port, () => {
  let now = new Date().toLocaleString("PT-br");
  console.log(`server starting on port: ${port} in: ${now}`);
});
