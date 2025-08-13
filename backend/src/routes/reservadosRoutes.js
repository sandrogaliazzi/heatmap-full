import express from "express";
import ReservadosController from "../controllers/reservadosController.js";

const router = express.Router();

router
  .get("/reservados", ReservadosController.ListReservados) // Lista todos os reservados
  .post("/reservados", ReservadosController.CreateReservados) // Adiciona um novo reservado
  .put("/reservados/:id", ReservadosController.UpdateReservados) // Atualiza um reservado
  .delete("/reservados/:id", ReservadosController.DeleteReservados); // Deleta um reservado

export default router;
