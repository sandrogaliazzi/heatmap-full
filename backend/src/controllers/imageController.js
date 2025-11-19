import Image from "../models/imageUploadModel.js";
import fs from "fs";

class ImageController {
  static async uploadImage(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Nenhuma imagem foi enviada" });
      }

      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const imageUrl = `${baseUrl}/images/${req.file.filename}`;

      const newImage = new Image({
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: req.file.path,
        url: imageUrl,
        size: req.file.size,
        mimetype: req.file.mimetype,
      });

      await newImage.save();

      res.status(201).json({
        message: "Imagem salva com sucesso!",
        image: {
          id: newImage._id,
          filename: newImage.filename,
          url: newImage.url,
          originalName: newImage.originalName,
          size: newImage.size,
        },
      });
    } catch (error) {
      console.error("Erro ao salvar imagem:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  static async getImage(req, res) {
    try {
      const image = await Image.findById(req.params.id);

      if (!image) {
        return res.status(404).json({ error: "Imagem não encontrada" });
      }

      res.json(image);
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar imagem" });
    }
  }

  static async deleteImage(req, res) {
    try {
      const image = await Image.findById(req.params.id);

      if (!image) {
        return res.status(404).json({ error: "Imagem não encontrada" });
      }

      if (fs.existsSync(image.path)) {
        fs.unlinkSync(image.path);
      }

      await Image.findByIdAndDelete(req.params.id);

      res.json({ message: "Imagem deletada com sucesso" });
    } catch (error) {
      res.status(500).json({ error: "Erro ao deletar imagem" });
    }
  }
}

export default ImageController;
