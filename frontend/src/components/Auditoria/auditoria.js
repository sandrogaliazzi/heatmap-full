import fetchApi from "@/api";

export const getAuditoriaLogs = async () => {
  try {
    const response = await fetchApi.get("/auditoria");
    return response.data;
  } catch (error) {
    console.error("Error fetching auditoria logs:", error);
  }
};

export const getAuditoriaLogsByClient = async (clientName) => {
  try {
    const response = await fetchApi.get(`/auditoria/client/${clientName}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching auditoria logs:", error);
  }
};

export const getAuditoriaLogsByCtoId = async (ctoId) => {
  try {
    const response = await fetchApi.get(`/auditoria/cto/${ctoId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching auditoria logs:", error);
  }
};

export const createAuditoriaLog = async (auditoriaData) => {
  try {
    const response = await fetchApi.post("/auditoria", auditoriaData);
    return response.data;
  } catch (error) {
    console.error("Error creating auditoria log:", error);
  }
};
