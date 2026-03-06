import hubsoftApi from "@/api/hubsoftApi";

export const getClientNameByMAC = async (mac, aliasFormat) => {
  if (!mac) return;
  try {
    const response = await hubsoftApi.get(
      `/api/v1/integracao/cliente?busca=mac&termo_busca=${mac}&inativo=nao&limit=1`,
    );

    if (
      response.data.status === "success" &&
      response.data.clientes.length > 0
    ) {
      const cliente = response.data.clientes[0];
      let name;
      if (aliasFormat === "parks") {
        name = cliente.nome_razaosocial.split(" ").join("-");
        return {
          name,
          onu: mac,
        };
      }

      name = cliente.nome_razaosocial;
      return {
        name,
        onu: mac,
      };
    } else {
      return {
        name: `ONU-ALIAS-${mac.slice(-4)}`,
        onu: mac,
      };
    }
  } catch (error) {
    console.error("Erro ao buscar cliente por MAC:", error);
    return {
      name: `ONU-ALIAS-${mac.slice(-4)}`,
      onu: mac,
    };
  }
};
