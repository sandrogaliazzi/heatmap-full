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
      const results = await ramalLogs.aggregate([
        { $unwind: "$gpon_data" },
        {
          $addFields: {
            gponAliasParts: { $split: ["$gpon_data.alias", "-"] },
          },
        },
        {
          $addFields: {
            gponAlias: {
              $cond: {
                if: { $gt: [{ $size: "$gponAliasParts" }, 1] },
                then: {
                  $reduce: {
                    input: {
                      $slice: [
                        "$gponAliasParts",
                        1,
                        { $size: "$gponAliasParts" },
                      ],
                    },
                    initialValue: "",
                    in: {
                      $cond: [
                        { $eq: ["$$value", ""] },
                        "$$this",
                        { $concat: ["$$value", "-", "$$this"] },
                      ],
                    },
                  },
                },
                else: "$gpon_data.alias", // fallback se não tiver "-"
              },
            },
          },
        },
        {
          $match: {
            $or: [{ gponAlias: alias }, { gponAlias: mac }],
          },
        },
        {
          $project: {
            _id: 0,
            date: "$date_time",
            gpon_data: 1,
          },
        },
        { $sort: { date: 1 } },
      ]);

      if (!results.length) {
        return res.status(404).json({ msg: "Dados de sinal não encontrados" });
      }

      return res.status(200).json(results);
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
