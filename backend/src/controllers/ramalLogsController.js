import ramalLogs from "../models/ramalModel.js";

class RamalLogsController {
  static SaveRamalLog = (req, res) => {
    const newLog = new ramalLogs(req.body);
    newLog.save(err => {
      if (err) {
        res
          .status(500)
          .send({ message: `${err.message} - falha ao cadastrar Logs` });
      } else {
        res.status(200).send({ message: "Log cadastrado com sucesso" });
      }
    });
  };

  static FindClientLogs = async (req, res) => {
    const { alias, mac } = req.query;

    if (!alias && !mac) {
      return res
        .status(400)
        .json({ msg: "É necessário fornecer alias ou mac." });
    }

    try {
      const ramals = await ramalLogs.find();
      const clientSignals = [];

      for (const ramal of ramals) {
        for (const gpon of ramal.gpon_data || []) {
          const fullAlias = gpon.alias || "";
          const aliasParts = fullAlias.split("-");
          const gponAlias = aliasParts.slice(1).join("-");

          if (gponAlias && (gponAlias === alias || gponAlias === mac)) {
            clientSignals.push({ date: ramal.date_time, ...gpon });
          }
        }
      }

      if (clientSignals.length > 0) {
        clientSignals.sort((a, b) => new Date(a.date) - new Date(b.date));
        return res.status(200).json(clientSignals);
      }

      return res.status(404).json({ msg: "Dados de sinal não encontrados" });
    } catch (error) {
      console.error("Erro ao buscar sinais do cliente:", error);
      return res
        .status(500)
        .json({ msg: "Erro interno no servidor", error: error.message });
    }
  };

  static FindRamalLogs = (req, res) => {
    const id = req.params.id;
    ramalLogs.find({ id }, (err, docs) => {
      if (docs) {
        res.status(200).send({ ramalHistory: docs });
      } else {
        res.status(500).send({ message: "Nenhum log registrado" });
      }
    });
  };
}

export default RamalLogsController;
