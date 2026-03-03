import jwt from "jsonwebtoken";
import User from "../models/users.js";
import dotenv from "dotenv";
dotenv.config();

// import config from "../config/dbConnect.js"
const config = process.env;

const verifyToken = async (req, res, next) => {
  const token =
    req.body.token || req.query.token || req.headers["x-access-token"];

  if (!token) {
    return res.status(403).send("A token is required for authentication");
  } else {
    try {
      const decoded = jwt.verify(token, config.TOKEN_KEY);
      const user = await User.findOne({ name: decoded.name });
      if (!user) {
        return res.status(404).json({ message: "Usuario não encontrado." });
      }
      if (user.blocked) {
        return res.status(403).json({ message: "Usuário bloqueado." });
      }
      req.user = decoded;
    } catch (err) {
      return res.status(401).json({ message: "Token inválido." });
    }
  }
  return next();
};

export default verifyToken;
