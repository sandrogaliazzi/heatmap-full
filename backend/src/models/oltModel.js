import mongoose from "mongoose";

const oltSchema = new mongoose.Schema({
  ipv4: { type: String, required: true },
  oltIp: { type: String, required: true },
  hubsoft_id: { type: String, required: true },
  oltName: { type: String, required: true },
  oltPop: { type: String, required: true },
  active: { type: Boolean, default: true },
});

const oltModel = mongoose.model("olts", oltSchema);

export default oltModel;
