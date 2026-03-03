import mongoose, { Schema } from "mongoose";

const UserSchema = new mongoose.Schema({
  id: { type: String },
  name: { type: String, require: true, unique: true },
  password: { type: String, require: true },
  category: { type: String, require: true },
  token: { type: String },
  avatar: { type: String },
  avatar_id: { type: String },
  sellerClass: { type: Number },
  goal: { type: Number },
  color: { type: String },
  refreshToken: { type: String },
  blocked: { type: Boolean, default: false },
});

const user = mongoose.model("user", UserSchema);

export default user;
