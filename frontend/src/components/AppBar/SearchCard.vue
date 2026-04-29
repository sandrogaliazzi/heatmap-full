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
const clients = ref([]);
const isLoadingClients = ref(true);

const fetchClients = async () => {
  try {
    const response = await fetchApi.get("/clients");
    clients.value = response.data;
    isLoadingClients.value = false;
  } catch (error) {
    console.error(error);
    isLoadingClients.value = false;
  }
};

const getCtoByName = (name) => {
  return ctoList.value.filter((cto) => cto.name.includes(name.toUpperCase()));
};

const getClientsByName = (name) => {
  return clients.value
    .filter((client) => client.name.includes(name.toUpperCase()))
    .map((client) => {
      const cto = ctoList.value.find((cto) => cto.id == client.ap_id_connected);
      return cto ? { ...client, ctoId: cto.id, ctoName: cto.name } : client;
    });
};

const findResults = () => {
  if (query.value) {
    if (query.value.split("").length > 3) {
      const typeOfSearch = /^(R\d+-CA\d+|CE-\d+|CD-\d+)$/.test(
        query.value.toUpperCase(),
      )
        ? "cto"
        : "client";

      switch (typeOfSearch) {
        case "cto":
          searchResults.value = getCtoByName(query.value);
          break;

        case "client":
          searchResults.value = getClientsByName(query.value);
          break;
      }
    }
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
  await fetchClients();
  findResults();
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
