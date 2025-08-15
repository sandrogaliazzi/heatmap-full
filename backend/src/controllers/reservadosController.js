import Reservados from "../models/Reservados.js";
import { deleteClientFromTomodat } from "../scripts/fetchApiTomodat.js";

class ReservadosController {
  static ListReservados = async (req, res) => {
    try {
      const reservados = await Reservados.find();
      res.status(200).json(reservados);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

  static CreateReservados = async (req, res) => {
    try {
      const { tomodat_id, name, coord, cto_id, created_at, user } = req.body;
      const newReservado = new Reservados({
        tomodat_id,
        name,
        coord,
        cto_id,
        created_at,
        user,
      });
      const savedReservado = await newReservado.save();
      res.status(201).json(savedReservado);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  };

  static UpdateReservados = async (req, res) => {
    try {
      const { tomodat_id, name, coord, cto_id, created_at } = req.body;
      const updatedReservado = await Reservados.findByIdAndUpdate(
        req.params.id,
        {
          tomodat_id,
          name,
          coord,
          cto_id,
          created_at,
        },
        { new: true }
      );
      res.status(200).json(updatedReservado);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  };

  static DeleteReservados = async (req, res) => {
    const { tomodat_id, id } = req.params;
    try {
      await Promise.all([
        Reservados.findByIdAndDelete(id),
        deleteClientFromTomodat(tomodat_id),
      ]);
      res.status(200).json({ message: "Deleted successfully" });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  };
}

export default ReservadosController;
