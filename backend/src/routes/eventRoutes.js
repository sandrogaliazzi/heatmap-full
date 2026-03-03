import express from "express";
import auth from "../middleware/auth.js";
import EventController from "../controllers/eventController.js";

const router = express.Router();

router
  .get("/listevents", auth, EventController.ListEvent) // Lista os eventos
  .get("/events-per-page", auth, EventController.ListEventsPaginated) //Lista os eventos de forma paginada
  .post("/addevent", auth, EventController.AddEvent); // Adiciona ou atualiza um evento
export default router;
