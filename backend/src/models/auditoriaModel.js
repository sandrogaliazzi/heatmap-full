import mongoose from "mongoose";

const auditoriaScheme = new mongoose.Schema({
  user: { type: String, required: true },
  type: { type: String, required: true },
  message: { type: String, required: true },
  created_at: { type: Date, required: true, default: Date.now },
  ipAddress: { type: String, required: true },
  client: { type: String, required: false },
  status: { type: String, required: true },
  cto_id: { type: String, required: false },
});

const auditoria = mongoose.model("auditoria", auditoriaScheme);

export default auditoria;
