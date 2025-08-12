<script setup>
import { ref } from "vue";
import AdressForm from "./AdressForm.vue";
import CoordForm from "./CoordForm.vue";

const isActive = defineModel();
const emit = defineEmits(["update:userLocation"]);

const range = ref(300);

const getDeviceCoordinates = async () => {
  if (!navigator.geolocation) {
    throw new Error("Geolocalização não é suportada pelo seu navegador.");
  }

  return await new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        resolve({
          latitude: +latitude.toFixed(6),
          longitude: +longitude.toFixed(6),
        });
      },
      (error) => {
        reject(new Error(`Erro ao obter localização: ${error.message}`));
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );
  });
};

const getUserLocation = async () => {
  try {
    const userLocation = await getDeviceCoordinates();
    emit("update:userLocation", { ...userLocation, range: range.value });
  } catch (error) {
    console.error(error);
  }
};
</script>

<template>
  <v-dialog transition="dialog-top-transition" width="auto" v-model="isActive">
    <v-card>
      <v-toolbar title="Endereço de busca" color="orange"></v-toolbar>

      <v-card-text>
        <div class="d-flex flex-column ga-3">
          <v-btn color="primary" variant="outlined">
            minha localização
            <v-dialog activator="parent" width="auto">
              <v-card title="Confirmar Raio de busca">
                <v-card-text>
                  <v-text-field
                    type="number"
                    label="Raio"
                    variant="outlined"
                    v-model="range"
                  ></v-text-field>
                  <v-btn @click="getUserLocation">confirmar</v-btn>
                </v-card-text>
              </v-card>
            </v-dialog>
          </v-btn>
          <v-btn color="primary" variant="outlined">
            Digitar endereço
            <v-dialog activator="parent" max-width="600">
              <template #default="{ isActive }">
                <AdressForm
                  @submit-adress="
                    (location) => emit('update:userLocation', location)
                  "
                  @close-dialog="isActive = false"
                />
              </template>
            </v-dialog>
          </v-btn>
          <v-btn color="primary" variant="outlined">
            Inserir coordenadas
            <v-dialog activator="parent" width="auto">
              <CoordForm @submit-coords="emit('update:userLocation', $event)" />
            </v-dialog>
          </v-btn>
        </div>
      </v-card-text>

      <v-card-actions class="justify-end">
        <v-btn text="Fechar" @click="isActive = false"></v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
