import express  from "express";
import equipamentController from "../controllers/equipamentClientController.js";
import auth from "../middleware/auth.js";


const router = express.Router();

router
 .post("/equipamentcadastro", auth, equipamentController.equipamenteSave) // salva no banco os dados do equipamento.
 .get("/equipamentget", auth, equipamentController.FetchEquipament) // lsita os dados dos equipamentos.
 .put("/equipamentatualizar/:id", auth, equipamentController.atualizarEquipament) // update equipamento, id no params e dados no body dados.
 .delete("/equipamentdelete", auth, equipamentController.excluirEquipament) // deleta equipamento, id no params. 
 export default router;