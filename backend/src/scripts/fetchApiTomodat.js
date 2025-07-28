import dotenv from "dotenv";
dotenv.config();
import needle from "needle";
import fetch from "node-fetch";

const path = import("path");
const fetchAllAcessPoints = [];
const baseURL = "https://sp.tomodat.com.br/tomodat/api";

const coord = {
  lat: "-29.582734100531393",
  lng: "-50.9251693190768",
  range: "200000",
};

const reqConfig = {
  headers: {
    Authorization: "6f1abca83548d1d58a92e6562ed7e118358cc7ba",
    "Content-Type": "application/json",
    "Accept-encoding": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE",
  },
};

export async function getAllClients() {
  try {
    let response = await fetch(`${baseURL}/clients/`, reqConfig);
    let data = await response.json();
    return data;
  } catch (err) {
    console.error("erro em getALLclients" + err);
  }
}

function getClientsByCto(users, id) {
  return users
    .filter(user => user.ap_id_connected == id)
    .map(user => ({ name: user.name, id: user.id }));
}

export async function getAccessPointConnections(id) {
  const endpoint = `${baseURL}/access_points/get_connections/${id}`;

  try {
    const response = await fetch(endpoint, reqConfig);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching access point connections:", error);
    // Lide com o erro de acordo com a necessidade da sua aplicação
  }
}

//pegar todos os pontos de acesso
async function getAllAcessPoints() {
  try {
    let response = await fetch(
      `${baseURL}/access_points/${coord.lat}/${coord.lng}/${coord.range}`,
      reqConfig
    );
    let data = await response.json();
    fetchAllAcessPoints.push(...data);
    return data;
  } catch (err) {
    console.error("erro em getAllAP" + err.message);
  }
}

export async function getAllAcessPointsByRange(range, coordinates) {
  try {
    let response = await fetch(
      `${baseURL}/access_points/${coordinates.lat}/${coordinates.lng}/${range}`,
      reqConfig
    );
    let data = await response.json();
    return data;
  } catch (err) {
    console.error("erro ao obter AP por range" + err.message);
  }
}

export async function getAllAcessPointsByCity() {
  try {
    let response = await fetch(`${baseURL}/access_points/list_path`, reqConfig);
    let data = await response.json();
    return data;
  } catch (err) {
    console.error("erro em GetApByCity" + err.message);
  }
}

export function addClient(req, res) {
  let client = req.body;
  needle.post(
    `${baseURL}/clients/auto_connect/`,
    client,
    reqConfig,
    (err, resp, body) => {
      if (err) {
        res
          .status(500)
          .send({ message: `${err.message} - falha ao cadastrar user.` });
      } else {
        res.status(201).json(body);
      }
    }
  );
}

function getCtoCityById(aplist, id) {
  return aplist
    .filter(ap => ap.id === id)
    .map(ap => ap.tree[ap.tree.length - 1]);
}

export async function fetchTomodat() {
  try {
    let [aplist, apListWithCity, users] = await Promise.all([
      getAllAcessPoints(),
      getAllAcessPointsByCity(),
      getAllClients(),
    ]);
    let ctoList = aplist ? aplist : fetchAllAcessPoints;
    let ctoListFilter = ctoList.filter(ap => ap.category === 5);

    let usersByCto = ctoListFilter.map(cto => {
      return {
        id: cto.id,
        name: cto.name,
        coord: cto.dot,
        clients: getClientsByCto(users, cto.id),
        city: getCtoCityById(apListWithCity, cto.id)[0],
        percentage_free: cto.percentage_free,
      };
    });
    return usersByCto;
  } catch (err) {
    console.log(err);
  }
}

export async function checkViability(lat, lng, range = 10) {
  try {
    const response = await fetch(
      `${baseURL}/clients/viability/${lat}/${lng}/${range}`,
      reqConfig
    );
    let data = await response.json();
    return data;
  } catch (error) {
    console.error("erro ao checar viabilidade " + error.message);
  }
}

export async function newFetchTomodat() {
  try {
    const [aplist, apListWithCity, users] = await Promise.all([
      getAllAcessPoints(),
      getAllAcessPointsByCity(),
      getAllClients(),
    ]);
    let tomodat = aplist ? aplist : fetchAllAcessPoints;
    let ctoCeList = tomodat.filter(
      ap => ap.category === 5 || ap.category === 4
    );

    let apListWithClients = ctoCeList.map(cto => {
      return {
        id: cto.id,
        name: cto.name,
        coord: cto.dot,
        category: cto.category,
        color: cto.color,
        clients: getClientsByCto(users, cto.id),
        city:
          cto.category === 5
            ? getCtoCityById(apListWithCity, cto.id)[0]
            : "INDEFINIDO",
        percentage_free: cto.percentage_free,
      };
    });

    return apListWithClients;
  } catch (err) {
    console.log(err);
  }
}
