<script setup>
import { inject } from "vue";
import { useTomodatStore } from "@/stores/tomodat";
import { useNotificationStore } from "@/stores/notification";
import fetchApi from "@/api";

const { source } = defineProps(["source"]);

const closeDialog = inject("closeDialog");
const tomodatStore = useTomodatStore();
const notification = useNotificationStore();

const triggerNotification = (msg) => {
  notification.setNotification({
    msg,
    status: "success",
  });
};

const loadInitialResults = inject("loadInitialResults");

const deleteClient = async (id) => {
  if (confirm("deseja excluir este cliente?")) {
    try {
      const response = await fetchApi.delete(`deleteclientfromtomodat/${id}`);

      if (response.status === 200) {
        triggerNotification("cliente excluido com sucesso!");
        loadInitialResults();
      }
    } catch (error) {
      console.error("erro ao excluir cliente " + error.message);
    }
  }
};

const setCto = ({ ctoId, ctoName, id, name, apartment_id }) => {
  if (apartment_id) return;
  tomodatStore.selectedUserLocation = null;
  tomodatStore.selectedCto = ctoId || id;
  tomodatStore.queryCto = ctoName || name;
  tomodatStore.mapZoom = 16;
  closeDialog();
};
</script>

<template>
  <v-list-item :title="source.name" :value="source.id">
    <template v-slot:prepend>
      <v-avatar color="grey-lighten-1">
        <v-icon color="white">mdi-google-maps</v-icon>
      </v-avatar>
    </template>
    <v-list-item-subtitle v-if="source.city">
      {{ source.city == "ZCLIENTES NÃO VERIFICADOS" ? "ARARICA" : source.city }}
    </v-list-item-subtitle>
    <v-list-item-subtitle v-else-if="source.apartment_id">
      PAC PON
    </v-list-item-subtitle>
    <v-list-item-subtitle v-else>
      {{ source.ctoName }}
    </v-list-item-subtitle>

    <template v-slot:append>
      <v-btn
        color="grey-lighten-1"
        icon="mdi-cube"
        variant="text"
        @click="setCto(source)"
      ></v-btn>
      <v-btn
        color="grey-lighten-1"
        icon="mdi-delete"
        variant="text"
        v-role="['adm']"
        v-if="!source.city"
        @click="deleteClient(source.id)"
      ></v-btn>
    </template>
  </v-list-item>
</template>
