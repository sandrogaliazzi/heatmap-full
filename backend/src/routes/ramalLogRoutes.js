import express from "express";
import RamalLogsController from "../controllers/ramalLogsController.js";
import { getPonSignals } from "../scripts/uploadSignals.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.post("/ramal-log-register", auth, RamalLogsController.SaveRamalLog); // salva no banco os dados do pppoe.
router.get("/find-ramal-logs/:id", auth, RamalLogsController.FindRamalLogs); //retorna ramais no banco
router.get("/find-client-signal-logs", auth, RamalLogsController.FindClientLogs);
router.get("/get-ramal-logs/:date", auth, RamalLogsController.GetRamalLogs);
router.get("/get-ramal-signals", auth, async (_, res) => {
  const data = await getPonSignals();
  res.status(200).json(data);
}); // busca todos os logs de um cliente e retorna para estes sinais

export default router;
