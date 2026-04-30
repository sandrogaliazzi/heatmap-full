import { fetchTomodat } from "../scripts/fetchApiTomodat.js";
import {
  getAllAcessPointsByCity,
  getAccessPointConnections,
  checkViability,
  getAllAcessPointsByRange,
  getAllClients as fetchAllClients,
  addClient,
  getClientById,
} from "../scripts/fetchApiTomodat.js";
import tomodatcompleto16052023 from "../models/tomodatcompleto.js";
import needle from "needle";
import auditoriaModel from "../models/auditoriaModel.js";
import { getOrSetCache } from "../config/redisClient.js";
import redis from "../config/redisClient.js";

const baseApiUrl = "https://sp.tomodat.com.br/tomodat/api";
const CLIENTS_CACHE_KEY = "cache:tomodat:clients:v2";
const CLIENTS_CACHE_TTL = 600;

const invalidateClientsCache = () =>
  redis.del(CLIENTS_CACHE_KEY).catch((error) => {
    console.error("[Redis] falha ao invalidar cache de clientes:", error.message);
  });

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

  static getAllClients = async (req, res) => {
    try {
      const { q, cto_id, limit } = req.query;
      const maxResults = Number.parseInt(limit, 10) || null;
      const search = typeof q === "string" ? q.trim().toUpperCase() : "";
      const ctoId = typeof cto_id === "string" ? cto_id.trim() : "";

      const data = await getOrSetCache(
        CLIENTS_CACHE_KEY,
        CLIENTS_CACHE_TTL,
        fetchAllClients
      );

      if (!Array.isArray(data)) {
        throw new Error("Cache de clientes retornou um formato invalido");
      }

      let clients = data;

      if (ctoId) {
        clients = clients.filter((client) => String(client.ap_id_connected) === ctoId);
      }

      if (search) {
        clients = clients.filter((client) =>
          String(client.name ?? "").toUpperCase().includes(search)
        );
      }

      if (maxResults && maxResults > 0) {
        clients = clients.slice(0, maxResults);
      }

      res.status(200).json(clients);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: `Erro ao buscar clientes: ${error}` });
    }
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

    addClient(req, res, invalidateClientsCache);
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
        async (err, response, body) => {
          if (err) {
            return res.status(500).json({
              status: "error",
              message: `${err.message} - falha ao deletar cliente.`,
            });
          }

          if (!response || response.statusCode < 200 || response.statusCode >= 300) {
            return res.status(response?.statusCode || 502).json({
              status: "error",
              message: "Falha ao deletar cliente no Tomodat.",
              data: body,
            });
          }

          await invalidateClientsCache();

          return res.status(200).json({
            status: "success",
            message: "Cliente deletado com sucesso",
            data: response.body,
          });
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
