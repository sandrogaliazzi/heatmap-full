import mongoose from "mongoose";

const ReservadosSchema = new mongoose.Schema({
  tomodat_id: { type: String, required: true },
  name: { type: String, required: true },
  coord: { type: Object, required: true },
  created_at: { type: Date, default: Date.now },
  cto_id: { type: String, required: true },
});

const Reservados = mongoose.model("Reservados", ReservadosSchema);

export default Reservados;
