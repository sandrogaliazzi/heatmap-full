const USER_TOKEN = "1d5239793dc902884e533885ee42f917";
const PASSWORD = "3206faa077c375";

const MK_GET_TOKEN = `https://mk.conectnet.net/mk/WSAutenticacao.rule?sys=MK0&token=${USER_TOKEN}&password=${PASSWORD}&cd_servico=9999`;

const MK_CLIENT_FONE = `https://mk.conectnet.net/core-api/pessoas/nome?nome=&token=`;

export const getMkToken = async () => {
  const gerarToken = await fetch(MK_GET_TOKEN);
  const data = await gerarToken.json();

  return data.Token;
};

const replaceParams = (params, values, str) => {
  return params.reduce((url, param, i) => {
    return url.replace(param, values[i]);
  }, str);
};

export const getClientFone = async (name, token) => {
  const url = replaceParams(
    ["nome=", "token="],
    [`nome=${name}`, `token=${token}`],
    MK_CLIENT_FONE
  );

  const response = await fetch(url);

  const client = await response.json();

  return client;
};
