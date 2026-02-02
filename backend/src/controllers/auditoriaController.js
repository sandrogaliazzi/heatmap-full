import Auditoria from "../models/auditoriaModel.js";

class AuditoriaController {
  static async create(req, res) {
    const newAuditoriaBody = {
      ...req.body,
      ipAddress: req.clientIP,
      user: req.user.name,
    };
    try {
      const newAuditoria = new Auditoria(newAuditoriaBody);
      await newAuditoria.save();
      res.status(201).json(newAuditoria);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  static async listAll(req, res) {
    try {
      const auditorias = await Auditoria.find().sort({ created_at: -1 });
      res.status(200).json(auditorias);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  static async listByCtoId(req, res) {
    try {
      const ctoId = req.params.ctoId;
      const auditorias = await Auditoria.find({ cto_id: ctoId }).sort({
        created_at: -1,
      });
      if (!auditorias) {
        return res.status(404).json({ message: "Auditorias não encontradas" });
      }
      res.status(200).json(auditorias);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
}

export default AuditoriaController;
