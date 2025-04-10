import Event from "../models/eventModel.js";

class EventController {
  static AddEvent(req, res) {
    try {
      const { _id } = req.body;

      if (!_id) {
        const event = new Event({ ...req.body });
        event.save(err => {
          if (err)
            res.status(500).send({
              message: `erro: ${err.message}, falha ao cadastrar evento`,
            });
          else
            res
              .status(200)
              .send({ message: "Evento cadastrada com sucesso", event });
        });
      } else {
        Event.findByIdAndUpdate({ _id }, { ...req.body }, (err, doc) => {
          if (!err)
            res
              .status(200)
              .send({ message: "Evento atualizada com sucesso", event: doc });
        });
      }
    } catch (error) {
      throw error;
    }
  }

  static async ListEventsPaginated(req, res) {
    const page = parseInt(req.query.page) || 1; // página atual
    const limit = parseInt(req.query.limit) || 10; // itens por página

    try {
      const events = await Event.find()
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ startTime: -1 });

      const total = await Event.countDocuments();

      res.json({
        page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        events,
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  static ListEvent(_, res) {
    try {
      Event.find({}, (err, docs) => {
        if (!err) res.status(200).send(docs);
        else res.status(500).send({ message: `erro: ${err.message}` });
      });
    } catch (error) {
      throw error;
    }
  }
}

export default EventController;
