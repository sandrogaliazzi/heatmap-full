export const getApiErrorMessage = (
  error,
  fallback = "Nao foi possivel concluir a operacao.",
) => {
  if (!error) return fallback;

  if (error.code === "ECONNABORTED") {
    return "A requisicao demorou demais para responder. Tente novamente.";
  }

  const responseMessage =
    error.response?.data?.message ||
    error.response?.data?.error ||
    error.response?.data?.msg;

  if (responseMessage) {
    return responseMessage;
  }

  if (error.message === "Network Error") {
    return "Nao foi possivel conectar com a API.";
  }

  return error.message || fallback;
};
