<script setup>
import { computed } from "vue";

import CtoClientsList from "./CtoClientsList.vue";
import AddClientForm from "./AddClientForm.vue";
import ClientMap from "./ClientMap.vue";
import CtoHistory from "./CtoHistory.vue";

const props = defineProps([
  "slideNumber",
  "loading",
  "clients",
  "cto",
  "clientsWithLocation",
  "positionClicked",
  "clientLocation",
  "showOnuCard",
]);
const emit = defineEmits([
  "update:slideNumber",
  "addUserLocation",
  "deleteUser",
  "openLocation",
  "reloadCto",
  "reloadCtoAndGoBack",
  "updateServiceLocation",
  "deleteClientLocation",
]);

const currentSlide = computed({
  get: () => props.slideNumber,
  set: (value) => emit("update:slideNumber", value),
});
</script>

<template>
  <v-window v-model="currentSlide" class="overflow-auto">
    <!-- clientes -->
    <v-window-item :value="1">
      <v-card-text style="padding-bottom: 0">
        <template v-if="!loading.connections">
          <template v-if="!showOnuCard">
            <CtoClientsList
              v-if="clients.length > 0"
              :model-value="clients"
              :cto="cto"
              :clients-with-location="clientsWithLocation"
              @adduser:location="(client) => emit('addUserLocation', client)"
              @delete-user="emit('deleteUser')"
              @open:location="(location) => emit('openLocation', location)"
            />
            <v-sheet
              :height="400"
              v-else
              class="d-flex flex-column justify-center align-center"
            >
              <v-icon size="200px">mdi-account-group</v-icon>
              <p class="text-button">Nenhum cliente cadastrado</p>
            </v-sheet>
          </template>
        </template>
        <v-sheet
          v-else
          :height="400"
          class="d-flex justify-center align-center"
        >
          <v-progress-circular
            color="orange"
            indeterminate
            :size="128"
            :width="6"
          ></v-progress-circular>
        </v-sheet>
      </v-card-text>
    </v-window-item>

    <!-- form add cliente -->
    <v-window-item :value="2">
      <v-card-text>
        <AddClientForm
          :clientPosition="positionClicked"
          :cto="cto"
          :clients="clients"
          :clients-with-location="clientsWithLocation"
          @update-cto-clietns="emit('reloadCtoAndGoBack')"
          @update-service-location="
            (location) => emit('updateServiceLocation', location)
          "
        />
      </v-card-text>

      <v-card-actions class="d-flex justify-space-between mt-4 px-6">
        <v-btn
          color="blue"
          prepend-icon="mdi-chevron-left"
          variant="tonal"
          class="mb-2"
          @click="currentSlide--"
          >Voltar</v-btn
        >
      </v-card-actions>
    </v-window-item>

    <!-- histórico -->
    <v-window-item :value="3">
      <CtoHistory :ctoId="cto.id" />
    </v-window-item>

    <!-- localização dos clietnes -->
    <v-window-item :value="4" v-if="clientLocation">
      <ClientMap
        :client-location="clientLocation"
        @update:clientLocation="emit('reloadCto')"
        @delete:clientLocation="emit('deleteClientLocation')"
      />
    </v-window-item>
  </v-window>
</template>
