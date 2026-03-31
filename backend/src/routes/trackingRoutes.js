import express  from "express";
import TrakingController from "../controllers/trackingController.js";
import auth from "../middleware/auth.js";


const router = express.Router();

router
 .post("/tracking", auth, TrakingController.CadastrarTracking) // cadastra o tracking no banco
 .post("/trackinget", auth, TrakingController.ListarTrackingById) // lista o tracking no banco
 
 
export default router;