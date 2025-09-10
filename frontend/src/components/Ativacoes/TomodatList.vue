<script setup>
import fetchApi from "@/api";
import { ref, onMounted } from "vue";
import OsMap from "./OsMap.vue";
import ReservadosList from "../Reservados/ReservadosList.vue";

const tomodatList = defineModel();

const loading = ref(false);

const getPppoe = (name) => {
  return (
    name.split(" ")[0] + name.split(" ")[name.split(" ").length - 1] + "fibra"
  );
};

onMounted(() => {
  console.log(tomodatList.value);
});

const handleMarkerDrop = (event, data) => {
  try {
    console.log("Marker dropped", event.latLng.lat(), event.latLng.lng());

    const tomodat = tomodatList.value.find((tomodat) => tomodat.id === data.id);
    tomodat.latitude = event.latLng.lat();
    tomodat.longitude = event.latLng.lng();

    const index = tomodatList.value.findIndex(
      (tomodat) => tomodat.id === data.id
    );
    tomodatList.value[index] = tomodat;

    alert("Coordenadas atualizadas com sucesso!");
  } catch (error) {
    console.log(error);
  }
};

const normalizeName = (name) =>
  name.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const saveTomodat = async () => {
  loading.value = true;
  const payload = tomodatList.value
    .filter((tomodat) => tomodat.id)
    .map((tomodat) => {
      return {
        name: normalizeName(tomodat.client),
        pppoe: getPppoe(tomodat.client).toLowerCase(),
        lat: tomodat.latitude,
        lng: tomodat.longitude,
        cto_id: tomodat.id,
        user: tomodat.user,
        cto_name: tomodat.name,
        date_time: new Date().toLocaleString("pt-BR", { timeZone: "UTC" }),
      };
    });

  console.log(payload);

  for (const item of payload) {
    try {
      const response = await fetchApi.post("client", item);
      if (response.status === 201) {
        console.log("Cliente " + item.name + " cadastrado com sucesso!");
      }
    } catch (error) {
      console.error("erro ao adicionar cliente " + error.message);
    }
  }
  alert("Clientes cadastrados com sucesso!");
  loading.value = false;
};
</script>
<template>
  <v-container>
    <v-btn
      :loading="loading"
      :disabled="loading"
      color="success"
      class="mb-5"
      @click="saveTomodat"
    >
      Cadasrtrar Clientes
    </v-btn>
    <v-expansion-panels>
      <v-expansion-panel v-for="(tomodat, index) in tomodatList" :key="index">
        <v-expansion-panel-title>
          {{ tomodat?.name }} - {{ tomodat.id || "NÃO ENCONTRADO" }} -
          {{ tomodat?.client }}
          <template v-slot:actions="{ expanded }">
            <v-icon
              :color="tomodat.id ? 'success' : 'error'"
              :icon="expanded ? 'mdi-pencil' : 'mdi-chevron-down-circle'"
            ></v-icon> </template
        ></v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-container fluid>
            <v-row>
              <v-col cols="6">
                <OsMap
                  :tomodat="tomodat"
                  @handle-marker-drop="handleMarkerDrop"
                />
              </v-col>
              <v-col cols="6">
                <ReservadosList
                  :search-term="tomodat.client.split(' ')[0]"
                  style="max-height: 200px; overflow-y: auto"
                >
                  <template #header>
                    <span class="d-none"></span>
                  </template>
                </ReservadosList>
              </v-col>
            </v-row>
          </v-container>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </v-container>
</template>
