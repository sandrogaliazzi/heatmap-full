import express from "express";
import EventController from "../controllers/eventController.js";

const router = express.Router();

router
  .get("/listevents", EventController.ListEvent) // Lista os eventos
  .get("/events-per-page", EventController.ListEventsPaginated) //Lista os eventos de forma paginada
  .post("/addevent", EventController.AddEvent); // Adiciona ou atualiza um evento
export default router;
