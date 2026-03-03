import express from "express";
import UserController from "../controllers/usersController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router
  .get("/users", UserController.ListarUsers) // lista todos os usurios do db
  .post("/users", auth, UserController.RegisterUser) // cadastra usuario no db
  .put("/users/:id", auth, UserController.atualizarUser) // atualiza usuario no db pelo id
  .put("/users/avatar/:id", auth, UserController.atualizarAvatar) // atualiza avatar do usuario
  .delete("/users/:id", auth, UserController.excluirUser) // deleta o usuario no db pelo id
  .get("/users/:id", auth, UserController.ListarUsersPorId) // lista usuario pelo id
  .post("/login", UserController.userLogin) // login do usuario
  .get("/refresh-token", UserController.refreshToken) // refresh token do usuario
  .put("/user/block/:id", auth, UserController.bloquearUser) // bloqueia ou desbloqueia usuario
  .put("/user/revoke/:id", auth, UserController.deleteUserRefreshToken); // revoga tokens do usuario
export default router;
