import { ref, computed, watch } from "vue";
import { defineStore } from "pinia";
import fetchApi from "@/api/index.js";

export const useTomodatStore = defineStore("tomodat", () => {
  const ctoList = ref([]);
  const cableList = ref([]);
  const ctoListByCity = ref({});
  const queryCto = ref("R");
  const locatedClients = ref([]);
  const selectedCto = ref("");
  const loadingData = ref(true);
  const mapZoom = ref(11);
  const selectedUserLocation = ref(null);
  const isEventMarkerVisible = ref(false);
  const isCableVisible = ref(true);
  const setPolygonDrawMode = ref(false);

  async function getTomodatData(user) {
    let ctoResponse = [];
    try {
      if (user.category !== "convidado") {
        ctoResponse = await fetchApi.get("/newfetch");
        ctoList.value = ctoResponse.data;

        const cableResponse = await fetchApi.get("/cables");
        cableList.value = cableResponse.data;
      } else {
        ctoResponse = await fetchApi.get("/tomodat-basico");
        ctoList.value = ctoResponse.data.filter((d) => d.dot !== null);
      }

      loadingData.value = false;
    } catch (error) {
      console.error("Error fetching Tomodat data:", error);
    }
  }

  async function getAllLocatedClients() {
    const response = await fetchApi.get("ctoclient");

    locatedClients.value = response.data;
  }

  function addNewClient(data) {
    const { lat, lng, name, cto_id } = data;

    const newClient = {
      name,
      position: { value: { lat: +lat, lng: +lng } },
      id: Date.now(),
    };

    console.log(newClient);

    const cto = ctoList.value.find((cto) => cto.id === cto_id);

    if (cto) cto.clients.unshift(newClient);
  }

  const getClients = computed(() => {
    const clientList = [];

    ctoList.value.forEach((cto) => {
      const clients = cto.clients;

      clientList.push(
        clients.map((client) => ({
          ...client,
          ctoId: cto.id,
          ctoName: cto.name,
        }))
      );
    });

    return clientList.flat();
  });

  function getCto(id) {
    const cto = ctoList.value.find((cto) => cto.id == id);

    const locatedClients = getLocatedClientesByCto(id);

    cto.clients = cto.clients.map((client) => {
      const { name, id } = client;
      const position = {};

      position.value = false;

      const hasLocationRegistered = locatedClients.find((c) => c.name === name);

      if (hasLocationRegistered) {
        const { lat, lng, _id } = hasLocationRegistered;
        position.value = { lat: +lat, lng: +lng, _id };
      }

      return {
        name,
        id,
        position,
      };
    });

    return cto;
  }

  const getSelectedCtoPosition = computed(() => {
    const position = { lat: -29.67523007459448, lng: -50.87956603814547 };

    if (selectedCto.value) {
      selectedUserLocation.value = null;
      const { coord } = getCto(selectedCto.value);

      position.lat = +coord.lat;
      position.lng = +coord.lng;
    }

    return position;
  });

  const getSelectedUserPosition = computed(() => {
    if (!selectedUserLocation.value) {
      return false;
    }
    return {
      lat: selectedUserLocation.value.coords.latitude,
      lng: selectedUserLocation.value.coords.longitude,
    };
  });

  const getMarkersData = computed(() => {
    return ctoList.value.map((cto) => {
      const { lat, lng } = cto.coord ?? cto.dot;

      return {
        position: {
          lat: parseFloat(lat),
          lng: parseFloat(lng),
        },
        percentage_free: cto.percentage_free,
        title: cto.name,
        color: cto.color ?? null,
        id: cto.id,
        category: cto.category,
      };
    });
  });

  function toggleMarkers() {
    queryCto.value = queryCto.value ? "" : "123456";
  }

  const getLocatedClientesByCto = (ctoId) => {
    return locatedClients.value.filter((client) => client.cto_id == ctoId);
  };

  const getHeatMapData = computed(() => {
    return ctoList.value.map((cto) => {
      const { lat, lng } = cto.coord ?? cto.dot ?? { lat: 0, lng: 0 };

      return new google.maps.LatLng(parseFloat(lat), parseFloat(lng));
    });
  });

  getAllLocatedClients();

  return {
    ctoList,
    cableList,
    ctoListByCity,
    getTomodatData,
    getMarkersData,
    getHeatMapData,
    getCto,
    queryCto,
    toggleMarkers,
    addNewClient,
    getClients,
    selectedCto,
    getSelectedCtoPosition,
    getAllLocatedClients,
    selectedUserLocation,
    getSelectedUserPosition,
    isEventMarkerVisible,
    setPolygonDrawMode,
    loadingData,
    mapZoom,
    isCableVisible,
  };
});
