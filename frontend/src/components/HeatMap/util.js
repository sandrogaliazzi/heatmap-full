import { useTomodatStore } from "@/stores/tomodat";
import fetchApi from "@/api";

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
    const response = await fetchApi.get("/clients", {
      params: { cto_id: marker.id },
    });

    const clients = Array.isArray(response.data)
      ? response.data
      : marker?.clients ?? cto?.clients ?? [];

    return mapClients(clients);
  } catch (error) {
    try {
      const tomodatStore = useTomodatStore();
      const cto = tomodatStore.getCto(marker.id);
      const clients = marker?.clients ?? cto?.clients ?? [];
      return mapClients(clients);
    } catch (fallbackError) {
      console.error(error, fallbackError);
      alert("Ocorreu um erro ao buscar os clientes.");
      return [];
    }
  }
};
