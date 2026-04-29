import { useTomodatStore } from "@/stores/tomodat";

const mapClients = (clients) => {
  if (!Array.isArray(clients)) return [];

  return clients
    .map((client) => {
      const source = client?.client ?? client;
      const id = source?.id ?? source?.client_id ?? source?._id;
      const name = source?.name ?? source?.nome ?? source?.client_name;

      if (!id || !name) return null;

      return { id, name };
    })
    .filter(Boolean);
};

export const getClientes = async (marker) => {
  try {
    const tomodatStore = useTomodatStore();
    const cto = tomodatStore.getCto(marker.id);

    const clients = marker?.clients ?? cto?.clients ?? [];

    return mapClients(clients);
  } catch (error) {
    console.error(error);
    alert("Ocorreu um erro ao buscar os clientes.");
    return [];
  }
};
