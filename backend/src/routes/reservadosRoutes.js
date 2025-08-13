import express from "express";
import ReservadosController from "../controllers/reservadosController.js";

const router = express.Router();

router
  .get("/reservados", ReservadosController.ListReservados) // Lista todos os reservados
  .post("/reservados", ReservadosController.CreateReservados) // Adiciona um novo reservado
  .put("/reservados/:id", ReservadosController.UpdateReservados) // Atualiza um reservado
  .delete("/reservados/:id/:tomodat_id", ReservadosController.DeleteReservados); // Deleta um reservado e deleta junto do tomodat

export default router;
