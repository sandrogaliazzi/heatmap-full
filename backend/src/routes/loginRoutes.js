import express  from "express";
import LoginController from "../controllers/loginController.js"
import auth from "../middleware/auth.js";


const router = express.Router();

router
 .get("/logindataget", auth, LoginController.ListarLogin) // lista os logins do banco

 
export default router;