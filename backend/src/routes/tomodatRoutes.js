import express from "express";
import TomodatController from "../controllers/tomodatCrontoller.js";
import LogClientController from "../controllers/logsController.js";
import CtoClientController from "../controllers/ctoClientController.js";
import auth from "../middleware/auth.js";
import PppoeDataController from "../controllers/pppoeController.js";

const router = express.Router();

router
  .get("/tomodat", auth, TomodatController.ListarClients) // fetch direto do tomodat (60 segundos)
  .get("/tomodat-basico", TomodatController.ListarApenasCaixas)
  .get("/connections/:id", auth, TomodatController.getAPcon) //Pega todas as conexões de uma cto ou ce pelo id
  .get("/clients", auth, TomodatController.getAllClients)
  .get("/ctos", auth, TomodatController.ListarCtos)
  .post(
    "/client",
    auth,
    LogClientController.CadastrarLog,
    PppoeDataController.CadastroPppoe,
    CtoClientController.CadastrarCtoClientN,
    TomodatController.CadastrarClient
  ) // add cliente no db, log e tomodat.
  .get("/logctoclient", auth, LogClientController.ListarLogCtoClient) // lista os logs de clientes cadastrados nas ctos.
  .delete("/deleteclientfromtomodat/:id", auth, TomodatController.DeleteClient) //deleta cliente no servido do tomodat
  .get("/getalltomodat", auth, TomodatController.ListarCabos) //lista tomodat completo
  .post("/rotasave", auth, TomodatController.SalvarRota) // salva rota no banco
  .get("/viability/:lat/:lng", TomodatController.CheckTomodatViability) //checa a viabilidade de portas com base na localização
  .get("/aprange/:lat/:lng/:range", TomodatController.getApByRange);
export default router;
