import { defineStore } from "pinia";
import { ref, watch } from "vue";
import hubApi from "@/api/hubsoftApi";

export const useOsStore = defineStore("os", () => {
  const cores = {
    "(Suporte Hubsoft) Maciel Rodrigues": "#E6194B",
    "Agenda OS": "#3CB44B",
    "Cristian Alaor Haack": "#FFE119",
    "Cristiano Pereira Dias da Silva": "#0082C8",
    "David Henkel": "#F58231",
    "Diego Rosa": "#911EB4",
    "Douglas Pinto Silveira": "#46F0F0",
    "Eduardo Martins": "#F032E6",
    "Felipe Hugentobler": "#D2F53C",
    "Gabriel Souza": "#FABEBE",
    Giovani: "#008080",
    "Henrique Cristiano Wadenphul": "#E6BEFF",
    "Ismael Araujo da Silva": "#AA6E28",
    "Joao Vitor": "#FFFAC8",
    "Jose sidinei padilha": "#800000",
    Laerte: "#AFFF00",
    "Leonardo Nogueira da Silva": "#808000",
    "Leonardo Torres": "#FFD8B1",
    "Marcelo - Gestor do Setor de Agendamentos e Equipes Externas": "#000080",
    "Matheus Gustavo Kerschner": "#808080",
    "Misael Kasper": "#FFFFFF",
    "Sandro Galiazzi": "#000000",
    "TSV.NET SERVICOS (André)": "#FF4500",
    "TSV.NET SERVICOS (Jonatan)": "#1E90FF",
    "TSV.NET SERVICOS (Mike)": "#32CD32",
    "TSV.NET SERVICOS (Rafael)": "#FF1493",
    "Tcharles Viana": "#7B68EE",
    "Vinicius Molter": "#00FA9A",
    "Wellington Lazarin": "#B22222",
    "William Barbosa": "#FFD700",
    "William Gomes": "#4B0082",
    "William Kossmann": "#2F4F4F",
  };

  const osList = ref([]);
  const statusList = ref(["finalizado", "pendente", "aguardando_agendamento"]);
  const status = ref("pendente");
  const drawer = ref(false);
  const dateRange = ref([
    new Date().toISOString().split("T")[0],
    new Date().toISOString().split("T")[0],
  ]);

  const getTecnicos = async () => {
    try {
      const response = await hubApi.get(
        "/api/v1/integracao/configuracao/tecnico"
      );
      if (response.data.status === "success") {
        return response.data.tecnicos;
      }
    } catch (error) {
      console.error("Error fetching technicians:", error);
    }
  };

  const filterOsByTec = (tecnico) => {
    return osList.value.filter((item) => !item.tecnico === tecnico);
  };

  const toggleVisibility = (tecnico) => {
    visibleOs.value[tecnico] = !visibleOs.value[tecnico];
    saveVisibility(visibleOs.value);
  };

  const STORAGE_KEY = "os_visibility";

  const loadVisibility = () => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch {
      return false;
    }
  };

  const saveVisibility = (state) =>
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

  const visibleOs = ref(loadVisibility());

  const getTodayOsList = async () => {
    try {
      const tecnicos = await getTecnicos();
      const response = await Promise.all(
        tecnicos.map(async (tec) => {
          const os = await hubApi.get(
            `/api/v1/integracao/ordem_servico/todos?pagina=0&itens_por_pagina=100&data_inicio=${dateRange.value[0]}&data_fim=${dateRange.value[1]}&tecnico=${tec.id}&status=${status.value}`
          );

          return {
            os: os.data.ordens_servico,
            tecnico: tec.name,
          };
        })
      );

      response.forEach((list) => {
        if (visibleOs.value[list.tecnico] === undefined) {
          visibleOs.value[list.tecnico] = true;
        }
      });

      saveVisibility(visibleOs.value);

      osList.value = response.filter((list) => list.os.length > 0);
    } catch (error) {
      console.error("Error fetching OS list:", error);
    }
  };

  watch([dateRange, status], () => {
    getTodayOsList();
  });

  return {
    osList,
    getTodayOsList,
    cores,
    filterOsByTec,
    toggleVisibility,
    visibleOs,
    loadVisibility,
    saveVisibility,
    statusList,
    status,
    drawer,
    dateRange,
  };
});
