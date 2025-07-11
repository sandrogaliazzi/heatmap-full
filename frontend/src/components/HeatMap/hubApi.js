import hubApi from "../../api/hubsoftApi.js";

export async function getHubClientFone(clientName) {
  try {
    const url = `api/v1/integracao/cliente?busca=nome_razaosocial&termo_busca=${clientName}&inativo=nao&limit=1`;

    const response = await hubApi.get(url);

    if (response.data.clientes.length === 0) {
      return null;
    }

    return {
      fone: response.data.clientes[0].telefone_primario,
      nome: response.data.clientes[0].nome_razaosocial,
    };
  } catch (error) {
    console.error(`Erro ao buscar telefone do cliente ${clientName}`, error);
    throw error;
  }
}
