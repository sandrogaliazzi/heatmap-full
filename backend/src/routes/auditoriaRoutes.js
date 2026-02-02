import express from "express";
import AuditoriaController from "../controllers/auditoriaController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.post("/auditoria", auth, AuditoriaController.create);
router.get("/auditoria", auth, AuditoriaController.listAll);
router.get("/auditoria/cto/:ctoId", auth, AuditoriaController.listByCtoId);

export default router;
