import { ref, computed } from "vue";
import { defineStore } from "pinia";
import fetchApi from "@/api/index.js";

export const useTomodatStore = defineStore("tomodat", () => {
  const ctoList = ref([]);
  const cableList = ref([]);
  const ctoListByCity = ref({});
  const queryCto = ref("123456");
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
