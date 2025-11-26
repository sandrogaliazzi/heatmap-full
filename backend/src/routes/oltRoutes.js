import express from "express";
import oltController from "../controllers/oltController.js";
import OnuController from "../controllers/onuClientController.js";
import FiberHomeController from "../controllers/fiberhomeController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router
  .get("/ramais", auth, oltController.ListarRamais) // lista os ramais no banco.
  .put("/ramais", auth, oltController.editRamal)
  .delete("/ramais", auth, oltController.deleteRamal)
  .post("/ramais", auth, oltController.saveRamal)
  .post("/verificar-ramal", auth, oltController.verificarRamais) // lista os ramais no banco.
  .post(
    "/verificar-ramal-onu-configurar",
    auth,
    oltController.VerificarOnuAConfigurarPon
  )
  .post("/listar-onu", auth, oltController.listarOnu)
  .get("/descobrir-onu-fiberhome", auth, FiberHomeController.discoverOnus)
  .get("/listar-onu-fiberhome", auth, FiberHomeController.getAllONUsFromUNM)
  .post("/listar-perfis-gpon-parks", auth, oltController.VerificarPerfisGpon)
  .post(
    "/listar-vlan-translation",
    auth,
    oltController.VerificarVlanTranslation
  )
  .post("/liberar-onu-fiberhome", auth, FiberHomeController.addAndConfigOnu)
  .post("/verificar-onu-fiberhome", auth, FiberHomeController.getOnuSignals)
  .post("/verificar-onu", auth, oltController.VerificarOnu)
  .post("/verificar-onu-completo", auth, oltController.VerificarOnuSummary)
  .post("/verificar-pon", auth, oltController.VerificarSinalPon)
  .post("/verificar-onu-name-pon", auth, oltController.VerificarNomeOnuPon)
  .post("/verificar-onu-name-olt", auth, oltController.VerificarNomeOnuOlt)
  .post("/liberar-onu", auth, oltController.liberarOnu)
  .post("/liberar-onu-avulsa", auth, oltController.liberarOnuAvulsa)
  .post("/editar-onu", auth, OnuController.EditOnu, oltController.EditarOnu)
  .post("/deletar-onu", auth, oltController.deleteOnu)
  .post("/deletar-onu-fiberhome", auth, FiberHomeController.deleteOnu)
  .post("/atualizar-alias-onu", auth, oltController.EditarOnu)
  .post("/add-olt", auth, oltController.addOlt)
  .get("/listar-olt", auth, oltController.listOlts)
  .post("/editar-status-olt", auth, oltController.toggleOltActiveStatus)
  .delete("/delete-olt", auth, oltController.deleteOlt);

export default router;
