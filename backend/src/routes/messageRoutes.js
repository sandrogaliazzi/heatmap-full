import express from "express";
import MessageController from "../controllers/messageController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router
  .get("/list-messages", auth, MessageController.ListMessages) 
  .post("/addmessage", auth, MessageController.AddMessage) 
  .delete("/delete-message/:id", auth, MessageController.DeleteMessage);
export default router;
