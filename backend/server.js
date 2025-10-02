import app from "./src/app.js";
import http from "http";
import signalUpdateLoop from "./src/scripts/uploadSignals.js";
import tomodatUpdateLoop from "./src/scripts/updateFetch.js";
import deleteReservados from "./src/scripts/deleteReservados.js";

const port = process.env.PORT || 5005; //always 5005

const server = http.createServer(app);

// signalUpdateLoop();
// tomodatUpdateLoop();
// deleteReservados();

server.listen(port, () => {
  let now = new Date().toLocaleString("PT-br");
  console.log(`server starting on port: ${port} in: ${now}`);
});
