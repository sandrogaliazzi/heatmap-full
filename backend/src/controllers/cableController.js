import { listCables } from "../scripts/fetchCables.js";
import { getOrSetCache } from "../config/redisClient.js";

class CableController {
    static async ListCables(req, res) {
        try {
            const cables = await getOrSetCache("cache:cables", 9000, listCables);

            res.status(200).json(cables);
        } catch (error) {
            console.error("erro ao listar cabos " + error);
            res.status(500).json(error);
        }
    }
}

export default CableController;