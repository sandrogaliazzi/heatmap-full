import fetchApi from "@/api";

const mapClients = (connections) => {
  return connections
    .filter((conn) => conn.client)
    .map((client) => {
      return {
        id: client.client.id,
        name: client.client.name,
      };
    });
};

export const getClientes = async (marker) => {
  try {
    const response = await fetchApi("connections/" + marker.id);
    return mapClients(response.data);
  } catch (error) {
    console.error(error);
    alert("Ocorreu um erro ao buscar os clientes.");
  }
};
