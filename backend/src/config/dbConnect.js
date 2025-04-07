import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

mongoose.connect(process.env.MONGO_DB_ACCESS);

let db = mongoose.connection;

export default db;
