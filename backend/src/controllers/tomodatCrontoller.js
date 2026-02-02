import { fetchTomodat } from "../scripts/fetchApiTomodat.js";
import {
  getAllAcessPointsByCity,
  getAccessPointConnections,
  checkViability,
  getAllAcessPointsByRange,
  getAllClients,
  addClient,
  getClientById,
} from "../scripts/fetchApiTomodat.js";
import tomodatcompleto16052023 from "../models/tomodatcompleto.js";
import needle from "needle";
import auditoriaModel from "../models/auditoriaModel.js";

const baseApiUrl = "https://sp.tomodat.com.br/tomodat/api";

const reqConfig = {
  method: "DELETE",

  headers: {
    Authorization: "6f1abca83548d1d58a92e6562ed7e118358cc7ba",
    "Content-Type": "application/json",
    "Accept-encoding": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE",
  },
};

class TomodatController {
  static ListarClients = (req, res) => {
    fetchTomodat().then((data) => {
      res.json(data);
    });
  };

  static getAPcon = (req, res) => {
    const id = req.params.id;

    getAccessPointConnections(id)
      .then((data) => {
        res.status(200).json(data);
      })
      .catch((error) => {
        console.error(error); // Log the error for debugging
        res.status(500).json({ error: "Internal Server Error" }); // Send a generic error response
      });
  };

  static getAllClients = (_, res) => {
    getAllClients()
      .then((data) => {
        res.status(200).json(data);
      })
      .catch((error) => {
        console.error(error);
        res.status(500).json({ error: `Erro ao buscar clientes: ${error}` });
      });
  };

  static ListarCtos = (req, res) => {
    getAllAcessPointsByCity()
      .then((data) => {
        res.status(200).json(data);
      })
      .catch((error) => {
        console.error(error);
        res.status(500).json({ error: `Erro ao buscar CTOS: ${error}` });
      });
  };

  static CadastrarClient = async (req, res) => {
    const auditoriaEntry = new auditoriaModel({
      user: req.user.name,
      status: "cadastrado",
      message: `novo cliente cadastrado na cto ${req.body.cto_name}`,
      client: req.body.name,
      type: "tomodat",
      ipAddress: req.clientIP,
      cto_id: req.body.cto_id,
    });

    await auditoriaEntry.save();

    addClient(req, res);
  };

  static CheckTomodatViability = (req, res) => {
    const { lat, lng, range } = req.params;
    checkViability(lat, lng, range)
      .then((data) => {
        res.status(200).json(data);
      })
      .catch((error) => {
        res.status(500).json(error);
      });
  };

  static getApByRange = async (req, res) => {
    try {
      const { lat, lng, range } = req.params;
      const data = await getAllAcessPointsByRange(range, { lat, lng });
      res.status(200).json(data);
    } catch (error) {
      console.error("Erro ao buscar pontos de acesso:", error);
      res.status(500).json({ error: "Erro ao buscar pontos de acesso" });
    }
  };

  static ListarApenasCaixas = (_, res) => {
    getAllAcessPointsByCity()
      .then((data) => {
        res.status(200).json(data);
      })
      .catch((error) => {
        res.status(500).json(error);
      });
  };

  static DeleteClient = async (req, res) => {
    const id = req.params.id;

    const auditoriaEntry = new auditoriaModel({
      user: req.user.name,
      status: "deletado",
      message: `Cliente ${req.body.name} deletado da cto ${req.body.cto_name}.`,
      type: "tomodat",
      client: req.body.name,
      ipAddress: req.clientIP,
      cto_id: req.body.ctoId,
    });

    await auditoriaEntry.save();

    try {
      needle.delete(
        `${baseApiUrl}/clients/${id}`,
        null,
        reqConfig,
        (err, response) => {
          if (!err) {
            res.status(200).json({
              status: "success",
              message: "Cliente deletado com sucesso",
              data: response.body,
            });
          }
        },
      );
    } catch (error) {
      console.error("erro ao deletar cliente " + error.message);
      res.status(500).json(error);
    }
  };

  static ListarCabos = (req, res) => {
    tomodatcompleto16052023
      .find((err, tomodatcompleto16052023) => {
        res.status(200).json(tomodatcompleto16052023);
      })
      .sort({ _id: -1 });
  };

  static SalvarRota = (req, res) => {
    let novaRota = new tomodatcompleto16052023(req.body);
    novaRota.save((err) => {
      if (err) {
        res
          .status(500)
          .send({ message: `${err.message} - falha ao cadastrar rota.` });
      } else {
        res.status(200).send({ message: `tudo certo ao cadastrar rota.` });
      }
    });
  };
}

export default TomodatController;
