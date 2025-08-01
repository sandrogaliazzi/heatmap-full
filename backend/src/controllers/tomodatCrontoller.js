import { fetchTomodat } from "../scripts/fetchApiTomodat.js";
import {
  getAllAcessPointsByCity,
  getAccessPointConnections,
  checkViability,
  getAllAcessPointsByRange,
  getAllClients,
  addClient,
} from "../scripts/fetchApiTomodat.js";
import tomodatcompleto16052023 from "../models/tomodatcompleto.js";
import needle from "needle";

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
    fetchTomodat().then(data => {
      res.json(data);
    });
  };

  static getAPcon = (req, res) => {
    const id = req.params.id;

    getAccessPointConnections(id)
      .then(data => {
        res.status(200).json(data);
      })
      .catch(error => {
        console.error(error); // Log the error for debugging
        res.status(500).json({ error: "Internal Server Error" }); // Send a generic error response
      });
  };

  static getAllClients = (_, res) => {
    getAllClients()
      .then(data => {
        res.status(200).json(data);
      })
      .catch(error => {
        console.error(error);
        res.status(500).json({ error: `Erro ao buscar clientes: ${error}` });
      });
  };

  static ListarCtos = (req, res) => {
    getAllAcessPointsByCity()
      .then(data => {
        res.status(200).json(data);
      })
      .catch(error => {
        console.error(error);
        res.status(500).json({ error: `Erro ao buscar CTOS: ${error}` });
      });
  };

  static CadastrarClient = (req, res) => {
    addClient(req, res);
  };

  static CheckTomodatViability = (req, res) => {
    const { lat, lng } = req.params;
    checkViability(lat, lng)
      .then(data => {
        res.status(200).json(data);
      })
      .catch(error => {
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
      .then(data => {
        res.status(200).json(data);
      })
      .catch(error => {
        res.status(500).json(error);
      });
  };

  static DeleteClient = (req, res) => {
    const id = req.params.id;
    try {
      needle.delete(
        `${baseApiUrl}/clients/${id}`,
        null,
        reqConfig,
        (err, response) => {
          if (!err) {
            res.status(200).json({ status: 200 });
          }
        }
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
    novaRota.save(err => {
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
