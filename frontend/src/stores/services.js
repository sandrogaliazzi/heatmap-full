import { defineStore } from "pinia";
import { ref } from "vue";
import hubsoftApi from "@/api/hubsoftApi";

export const useServiceStore = defineStore("services", () => {
  const services = ref([]);

  const fetchServices = async () => {
    try {
      const response = await hubsoftApi.get(
        "/api/v1/integracao/configuracao/servico",
      );
      services.value = response.data.servicos;
    } catch (error) {
      console.error("Error ao carregar serviços do husbsoft:", error);
    }
  };

  fetchServices();

  return { services };
});
