import express from "express";
import auth from "../middleware/auth.js";
import ReservadosController from "../controllers/reservadosController.js";

const router = express.Router();

router
  .get("/reservados", auth, ReservadosController.ListReservados) // Lista todos os reservados
  .post("/reservados", auth, ReservadosController.CreateReservados) // Adiciona um novo reservado
  .put("/reservados/:id", auth, ReservadosController.UpdateReservados) // Atualiza um reservado
  .delete(
    "/reservados/:id/:tomodat_id",
    auth,
    ReservadosController.DeleteReservados,
  ); // Deleta um reservado e deleta junto do tomodat

export default router;
