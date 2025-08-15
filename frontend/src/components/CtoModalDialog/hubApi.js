import hubApi from "../../api/hubsoftApi.js";

export async function getOsByType(
  type = "30",
  startDate = "2023-09-20",
  endDate = new Date().toISOString().split("T")[0],
  status = "pendente",
  page = 0,
  osList = []
) {
  try {
    const response = await hubApi.get(
      `api/v1/integracao/ordem_servico/todos?pagina=${page}&itens_por_pagina=500&data_inicio=${startDate}&data_fim=${endDate}&tipo_ordem_servico=${type}&status=${status}`
    );

    osList.push(...response.data.ordens_servico);

    const atual = response.data.paginacao.pagina_atual;
    const ultima = response.data.paginacao.ultima_pagina;

    if (atual < ultima) {
      return await getOsByType(
        type,
        startDate,
        endDate,
        status,
        page + 1,
        osList
      );
    }

    return osList;
  } catch (error) {
    console.error("Erro ao obter OS:", error);
    throw error;
  }
}

export function extractCto(string) {
  const regex = /R\d{1,3}[-\s]*CA\d{1,2}/gi;
  const matches = string.match(regex);
  return matches ? matches[0].toUpperCase() : null;
}

function filterByCto(osList, cto) {
  return osList.filter((os) => extractCto(os.descricao_abertura) === cto);
}

function filterByCity(osList, cityFromTomodat) {
  let city = "";
  switch (cityFromTomodat) {
    case "M. PEDRA":
      city = ["PAROBÉ", "TAQUARA"];
      break;
    case "FAZ. FIALHO":
      city = ["TAQUARA", "GRAVATAÍ"];
      break;
    case "SÃO JOÃO DO DESERTO":
      city = ["GRAVATAÍ", "NOVO HAMBURGO"];
      break;
    case "SAPIRANGA":
      city = ["SAPIRANGA"];
      break;
    case "ARARICA":
      city = ["ARARICÁ"];
      break;
    case "IGREJINHA":
      city = ["IGREJINHA"];
      break;
    case "NOVA HARTZ":
      city = ["NOVA HARTZ"];
      break;
    case "PAROBE":
      city = ["PAROBÉ"];
      break;
    case "TRES COROAS":
      city = ["TRÊS COROAS"];
      break;
    case "MORUNGAVA":
      city = ["GRAVATAÍ"];
      break;
  }

  return osList.filter((os) =>
    city.includes(os.dados_endereco_instalacao.cidade)
  );
}

export async function getOsByTypeCtoAndCity(cto, city) {
  const osList = await getOsByType();
  const filteredByCto = filterByCto(osList, cto);
  const filteredByCity = filterByCity(filteredByCto, city);
  return filteredByCity;
}

export async function closeOs(os_id, user) {
  try {
    const response = await hubApi.post(
      `api/v1/integracao/ordem_servico/fechar`,
      {
        id_ordem_servico: os_id,
        gera_custo: false,
        data_inicio_executado: new Date().toISOString().split("T")[0],
        hora_inicio_executado: new Date().toTimeString().split(" ")[0],
        data_termino_executado: new Date().toISOString().split("T")[0],
        hora_termino_executado: new Date(Date.now() + 5 * 60 * 1000)
          .toTimeString()
          .split(" ")[0],
        status_fechamento: "concluido",
        descricao_fechamento: "RETIRADO CONECTOR POR " + user,
        motivo_fechamento: {
          id_motivo_fechamento: 27,
        },
        tecnicos: [{ id: "285" }],
      }
    );
    return response.data;
  } catch (error) {
    console.error("Erro ao fechar OS:", error);
    throw error;
  }
}
