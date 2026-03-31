import express from "express";
import BackupController from "../controllers/backupController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router
  .post("/backupclientemk", auth, BackupController.mkBackup) // recebe dados e faz backup.
  .post("/backupclienteubnt", auth, BackupController.ubntBackup); // recebe os dados e faz backup.
export default router;
