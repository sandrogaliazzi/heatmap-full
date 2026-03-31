import express from "express";
import CableController from "../controllers/cableController.js";
import auth from "../middleware/auth.js";


const router = express.Router();

router
  .get("/cables", auth, CableController.ListCables) // Lista os cabos do tomodat
export default router;