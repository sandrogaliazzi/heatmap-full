<script setup>
import { provide, ref, watch, onMounted } from "vue";
import { useTomodatStore } from "@/stores/tomodat";
import { storeToRefs } from "pinia";
import fetchApi from "@/api";
import ListResult from "./ListResult.vue";

defineProps(["isDesktop"]);

const tomodat = useTomodatStore();
const { ctoList } = storeToRefs(tomodat);
const query = ref(localStorage.getItem("lastQuery") || "");
const searchResults = ref([]);
const isLoadingClients = ref(true);
const searchRequestId = ref(0);

const getCtoByName = (name) => {
  return ctoList.value.filter((cto) => cto.name.includes(name.toUpperCase()));
};

const getClientsByName = async (name, requestId) => {
  const response = await fetchApi.get("/clients", {
    params: { q: name, limit: 50 },
  });

  if (requestId !== searchRequestId.value) return [];

  return response.data.map((client) => {
    const cto = ctoList.value.find((cto) => cto.id == client.ap_id_connected);
    return {
      ...client,
      ctoId: cto?.id ?? client.ap_id_connected,
      ctoName: cto?.name ?? client.cto_name,
    };
  });
};

const findResults = async () => {
  const searchText = query.value.trim();
  const requestId = searchRequestId.value + 1;
  searchRequestId.value = requestId;

  if (!searchText || searchText.length <= 3) {
    searchResults.value = [];
    isLoadingClients.value = false;
    return;
  }

  const typeOfSearch = /^(R\d+-CA\d+|CE-\d+|CD-\d+)$/.test(
    searchText.toUpperCase(),
  )
    ? "cto"
    : "client";

  if (typeOfSearch === "cto") {
    searchResults.value = getCtoByName(searchText);
    isLoadingClients.value = false;
    return;
  }

  isLoadingClients.value = true;
  try {
    const results = await getClientsByName(searchText, requestId);
    if (requestId === searchRequestId.value) {
      searchResults.value = results;
    }
  } catch (error) {
    console.error(error);
    if (requestId === searchRequestId.value) searchResults.value = [];
  } finally {
    if (requestId === searchRequestId.value) isLoadingClients.value = false;
  }
};

const searchTimeout = ref(null);
const debounceDelay = 500;

watch(query, () => {
  if (!query.value) searchResults.value = [];

  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
  }

  searchTimeout.value = setTimeout(() => {
    findResults();
  }, debounceDelay);

  localStorage.setItem("lastQuery", query.value);
});

const myInput = ref(null);

const loadInitialResults = async () => {
  await findResults();
};

provide("loadInitialResults", loadInitialResults);

onMounted(async () => {
  myInput.value.focus();
  await loadInitialResults();
});
</script>

<template>
  <v-card style="margin-top: 0 !important" :loading="isLoadingClients">
    <slot name="header"></slot>
    <v-card-text class="px-0 pt-0">
      <v-text-field
        placeholder="Nome do cliente ou cto"
        clearable
        prepend-inner-icon="mdi-magnify"
        v-model="query"
        ref="myInput"
      >
      </v-text-field>
      <div
        v-if="!searchResults.length && isDesktop"
        class="d-flex justify-center align-center text-center"
        style="min-height: 500px"
      >
        <v-icon size="200px"> mdi-database-search </v-icon>
      </div>
      <div
        v-else-if="!searchResults.length && !isDesktop"
        class="d-flex justify-center align-center text-center"
      >
        <v-icon size="250px"> mdi-database-search </v-icon>
      </div>
      <div v-else>
        <ListResult
          :results="searchResults"
          :query="query"
          :isDesktop="isDesktop"
        />
      </div>
    </v-card-text>
  </v-card>
</template>
