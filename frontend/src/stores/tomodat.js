import { ref, computed } from "vue";
import { defineStore } from "pinia";
import fetchApi from "@/api/index.js";

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutos
const CACHE_KEY_FULL = "tomodat_cache_full";
const CACHE_KEY_GUEST = "tomodat_cache_guest";

function readCache(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const cache = JSON.parse(raw);
    if (Date.now() - cache.timestamp > CACHE_TTL_MS) {
      localStorage.removeItem(key);
      return null;
    }
    return cache;
  } catch {
    return null;
  }
}

function writeCache(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({ timestamp: Date.now(), ...data }));
  } catch {
    // localStorage cheio ou indisponível — ignora silenciosamente
  }
}

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
    try {
      if (user.category !== "convidado") {
        const cached = readCache(CACHE_KEY_FULL);
        if (cached) {
          ctoList.value = cached.ctoList;
          cableList.value = cached.cableList;
          loadingData.value = false;
          return;
        }

        const [ctoResponse, cableResponse] = await Promise.all([
          fetchApi.get("/newfetch"),
          fetchApi.get("/cables"),
        ]);

        ctoList.value = ctoResponse.data;
        cableList.value = cableResponse.data;
        writeCache(CACHE_KEY_FULL, {
          ctoList: ctoResponse.data,
          cableList: cableResponse.data,
        });
      } else {
        const cached = readCache(CACHE_KEY_GUEST);
        if (cached) {
          ctoList.value = cached.ctoList;
          loadingData.value = false;
          return;
        }

        const ctoResponse = await fetchApi.get("/tomodat-basico");
        const filtered = ctoResponse.data.filter((d) => d.dot !== null);
        ctoList.value = filtered;
        writeCache(CACHE_KEY_GUEST, { ctoList: filtered });
      }

      loadingData.value = false;
    } catch (error) {
      console.error("Error fetching Tomodat data:", error);
    }
  }

  function invalidateCache() {
    localStorage.removeItem(CACHE_KEY_FULL);
    localStorage.removeItem(CACHE_KEY_GUEST);
  }

  async function getAllLocatedClients() {
    try {
      const response = await fetchApi.get("ctoclient");
      locatedClients.value = response.data;
    } catch (error) {
      console.error("Error fetching located clients:", error);
    }
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
        })),
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
    invalidateCache,
  };
});
