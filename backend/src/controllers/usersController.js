import user from "../models/users.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import auditoria from "../models/auditoriaModel.js";
import * as dotenv from "dotenv";
dotenv.config();

class UserController {
  static ListarUsers = (req, res) => {
    user.find((err, user) => {
      res.status(200).json(user);
    });
  };

  static ListarUsersPorId = (req, res) => {
    const id = req.params.id;
    user.findById(id, (err, user) => {
      res.status(200).json(user);
    });
  };

  static CadastrarUser = (req, res) => {
    let users = new user(req.body);
    users.save((err) => {
      if (err) {
        res
          .status(500)
          .send({ message: `${err.message} - falha ao cadastrar user.` });
      } else {
        res.status(201).send(users.toJSON());
      }
    });
  };

  static atualizarUser = async (req, res) => {
    try {
      const id = req.params.id;

      const dados = { ...req.body };
      const { password } = req.body;

      if (password) {
        const encryptedPassword = await bcrypt.hash(password, 10);
        dados.password = encryptedPassword;
      }

      await user.findByIdAndUpdate(id, { $set: dados });

      res.status(200).send({ message: "Alteração realizada com sucesso." });
    } catch (err) {
      res.status(500).send({ message: err.message });
    }
  };

  static async atualizarAvatar(req, res) {
    try {
      const id = req.params.id;
      let { avatar, avatar_id } = req.body;
      let dados = { avatar, avatar_id };
      await user.findByIdAndUpdate(id, { $set: dados });
      res.status(200).send({ message: "Alteração realizada com sucesso." });
    } catch (err) {
      res.status(500).send({ message: err.message });
    }
  }

  static RegisterUser = async (req, res) => {
    try {
      const userData = { ...req.body };

      if (!(userData.name && userData.password)) {
        res.status(400).send("All input is required");
      }

      let oldUser = await user.find({ name: userData.name });

      if (oldUser === userData.name) {
        return res.status(409).send("User Already Exist. Please Login");
      } else {
        let encryptedPassword = await bcrypt.hash(userData.password, 10);

        let usuario = await user.create({
          ...userData,
          password: encryptedPassword,
        });

        let token = jwt.sign(
          { user_id: usuario._id, name: userData.name },
          process.env.TOKEN_KEY,
          {
            expiresIn: "180h",
          },
        );

        usuario.save((usuario.token = token));

        res.status(201).send({ message: `${usuario.name} - cadastrado.` });
      }
    } catch (err) {
      console.log(err);
    }
  };

  static userLogin = async (req, res) => {
    try {
      let { name, password } = req.body;

      if (!(name && password)) {
        res.status(400).send("Credenciais invalidas.");
      }

      let usuario = await user.findOne({ name });

      if (usuario && (await bcrypt.compare(password, usuario.password))) {
        if (usuario.blocked) {
          return res.status(403).json({ message: "Usuario bloqueado." });
        }

        let token = jwt.sign(
          { user_id: usuario._id, name },
          process.env.TOKEN_KEY,
          {
            expiresIn: "15m",
          },
        );

        let refreshToken = jwt.sign(
          { user_id: usuario._id, name },
          process.env.REFRESH_TOKEN_KEY,
          {
            expiresIn: "7d",
          },
        );

        usuario.token = token;
        usuario.refreshToken = refreshToken;
        await usuario.save();

        const auditoriaEntry = new auditoria({
          user: name,
          type: "login",
          message: `Tentativa de login do usuario ${name}.`,
          status: "successo",
          ipAddress: req.clientIP,
        });

        await auditoriaEntry.save();

        res.cookie("refreshToken", refreshToken, {
          httpOnly: true,
          sameSite: "lax",
        });

        const userData = {
          id: usuario._id,
          name: usuario.name,
          category: usuario.category,
          token: usuario.token,
          avatar: usuario.avatar,
          avatar_id: usuario.avatar_id,
          sellerClass: usuario.sellerClass,
          goal: usuario.goal,
          color: usuario.color,
        };

        res.status(201).send(userData);
      } else {
        const auditoriaEntry = new auditoria({
          user: name,
          type: "login",
          message: `Tentativa de login falhou para o usuario ${name}.`,
          status: "falha",
          ipAddress: req.clientIP,
        });

        await auditoriaEntry.save();
        res.status(404).send({ message: `Usuario ou senha invalidos.` });
      }
    } catch (err) {
      console.log(err);
    }
  };

  static excluirUser = (req, res) => {
    const id = req.params.id;
    user.findByIdAndDelete(id, (err) => {
      if (!err) {
        res
          .status(200)
          .send({ message: `Usuario id: ${req.body.id} removido com sucesso` });
      } else {
        res.status(500).send({ message: err.message });
      }
    });
  };

  static refreshToken = async (req, res) => {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      return res.status(401).send("token nao encontrado.");
    }

    jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_KEY,
      async (err, userData) => {
        if (err) {
          return res.status(403).send("refresh Token inválido.");
        }

        const usuario = await user.findOne({ name: userData.name });
        if (!usuario) {
          return res.status(404).json({ message: "Usuario não encontrado." });
        }

        const accessToken = jwt.sign(
          { user_id: userData._id, name: userData.name },
          process.env.TOKEN_KEY,
          { expiresIn: "15m" },
        );
        res.status(200).json({ token: accessToken });
      },
    );
  };

  static deleteUserRefreshToken = async (req, res) => {
    try {
      const userId = req.params.id;

      const usuario = await user.findById(userId);

      if (!usuario) {
        return res.status(404).json({ message: "Usuario nao encontrado." });
      }

      usuario.refreshToken = null;
      await usuario.save();

      res.status(200).json({ message: "Refresh token deletado com sucesso." });
    } catch (error) {
      res.status(500).json({ message: "Erro ao deletar refresh token." });
    }
  };

  static bloquearUser = async (req, res) => {
    try {
      const userId = req.params.id;

      const usuario = await user.findById(userId);

      if (!usuario) {
        return res.status(404).json({ message: "Usuario nao encontrado." });
      }

      usuario.blocked = !usuario.blocked;
      usuario.refreshToken = null;
      await usuario.save();

      res.status(200).json({
        message: `Usuario ${usuario.blocked ? "bloqueado" : "desbloqueado"} com sucesso.`,
      });
    } catch (error) {
      res.status(500).json({ message: "Erro ao atualizar status do usuario." });
    }
  };
}

export default UserController;
