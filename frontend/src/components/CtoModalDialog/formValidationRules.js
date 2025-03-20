export default {
  nameRules: [
    (value) => {
      if (value) return true;

      return "O campo nome é obrigatório";
    },

    (value) => {
      if (/^[a-zA-Z0-9\s]+$/.test(value)) return true;

      return "O nome não pode conter acentos ou caracteres especiais";
    },
  ],

  pppoeRules: [
    (value) => {
      if (value) return true;

      return "O campo pppoe é obrigatório";
    },

    (value) => {
      if (/^[a-z0-9]+fibra$/.test(value)) return true;

      return "Pppoe no formato inválido";
    },
  ],

  positionRules: [
    (value) => {
      if (value) return true;

      return "Por favor, selecione a posição do cliente no mapa";
    },
  ],
};
