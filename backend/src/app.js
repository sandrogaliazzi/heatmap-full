import express from "express";
import routes from "./routes/index.js";
import db from "./config/dbConnect.js";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

const app = express();

//app.use(cors());
app.use("/images", express.static(path.join(__dirname, "../assets/images")));

db.on("error", console.log.bind(console, "erro de conexão"));
db.once("open", () => {
  let now = new Date().toLocaleString("PT-br");
  console.log(`conexão com o banco em: ${now}`);
});

app.get("/docapi", (req, res) => {
  res.sendFile(path.join(__dirname, "/index.html"));
});
app.get("/email", (req, res) => {
  res.sendFile(path.join(__dirname, "/email.html"));
});
app.get("/lista-email", (req, res) => {
  res.sendFile(path.join(__dirname, "/lista.html"));
});
app.use(express.json({ limit: "50mb" }));

routes(app);

export default app;
