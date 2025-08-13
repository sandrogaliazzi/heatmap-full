import Reservados from "../models/Reservados.js";
import { deleteClientFromTomodat } from "./fetchApiTomodat.js";

async function deleteIfExpired() {
  const reservados = await Reservados.find({});

  const now = new Date();

  if (reservados.length === 0) return;
  for (const reservado of reservados) {
    const reservadoCreatedAt = new Date(reservado.created_at);
    const diffTime = now.getTime() - reservadoCreatedAt.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // diferença em dias
    if (diffDays > 15) {
      // passou de 15 dias
      await Reservados.deleteOne({ _id: reservado._id });
      await deleteClientFromTomodat(reservado.tomodat_id);
    }
  }
}

export default function deleteReservados() {
  setInterval(async () => {
    await deleteIfExpired();
    console.log("deletado reservas com mais de 15 dias");
  }, 2 * 60 * 60 * 1000); // executa a cada 2 horas
}
