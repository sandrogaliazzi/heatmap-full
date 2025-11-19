import express from "express";
import ImageController from "../controllers/imageController.js";
import uploadMiddleware from "../middleware/upload.js";

const router = express.Router();

router
  .post(
    "/upload-image",
    uploadMiddleware.single("image"),
    ImageController.uploadImage
  )
  .get("/get-image/:id", ImageController.getImage)
  .delete("/delete-image/:id", ImageController.deleteImage);
export default router;
