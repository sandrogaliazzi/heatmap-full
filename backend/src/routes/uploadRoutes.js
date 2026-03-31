import express from "express";
import ImageController from "../controllers/imageController.js";
import uploadMiddleware from "../middleware/upload.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router
  .post(
    "/upload-image",
    auth,
    uploadMiddleware.single("image"),
    ImageController.uploadImage
  )
  .get("/get-image/:id", auth, ImageController.getImage)
  .delete("/delete-image/:id", auth, ImageController.deleteImage);
export default router;
