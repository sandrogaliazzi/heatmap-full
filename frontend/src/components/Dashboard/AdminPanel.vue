<script setup>
import { onMounted, ref } from "vue";

import UsersCard from "./UsersCard.vue";
import LogsCard from "./LogsCard.vue";
import CameraCard from "./CameraCard.vue";
import Charts from "./Charts.vue";
import fetchApi from "@/api";

const usersData = ref([]);
const camerasData = ref([]);
const logsData = ref([]);
const loading = ref(true);

const loadCardsInfo = async () => {
  const promises = ["users", "getallcameras", "logctoclient"].map(
    async (endpoint) => await fetchApi(endpoint)
  );

  const [users, cameras, logs] = await Promise.all(promises);

  loading.value = false;

  usersData.value = users.data;
  camerasData.value = cameras.data;
  logsData.value = logs.data.map((log) => {
    const [_, month, year] = log.date_time.split(",")[0].split("/");
    return {
      ...log,
      splitDate: {
        month,
        year,
      },
    };
  });
};

onMounted(() => {
  loadCardsInfo();
});
</script>

<template>
  <v-row justify="center">
    <v-col cols="12" md="4">
      <UsersCard :users="usersData" :loading="loading" />
    </v-col>
    <v-col cols="12" md="4">
      <LogsCard :logs="logsData" :loading="loading" />
    </v-col>
    <v-col cols="12" md="4">
      <CameraCard :cameras="camerasData" :loading="loading" />
    </v-col>
  </v-row>
  <Charts :logs="logsData" />
</template>
