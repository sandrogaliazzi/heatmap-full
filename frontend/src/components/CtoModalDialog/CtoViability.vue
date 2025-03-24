<script setup>
import { ref, onMounted, inject } from "vue";
import fetchApi from "@/api";

const { dot } = defineProps(["dot"]);

const portsAvailable = ref(false);
const closeDialog = inject("closeDialog");
const cardLoader = ref(true);

onMounted(async () => {
  const { lat, lng } = dot.position;
  const response = await fetchApi(`viability/${lat}/${lng}`);

  if (response.status === 200) {
    cardLoader.value = false;
    portsAvailable.value = response.data
      .flatMap((data) => data.splitters)
      .reduce((acc, splitter) => acc + splitter.free_ports_number, 0);
  } else alert("ocorreu um erro ao checar viabilidade");

  //console.log("Total de portas disponíveis:", portsAvailable.value);
});
</script>

<template>
  <v-card :loading="cardLoader">
    <v-card-text>
      <v-sheet
        max-width="600"
        rounded="lg"
        width="100%"
        class="pa-4 text-center mx-auto"
      >
        <v-icon
          class="mb-5"
          :color="portsAvailable > 0 ? 'success' : 'error'"
          :icon="portsAvailable > 0 ? 'mdi-check-circle' : 'mdi-alert-circle'"
          size="112"
        ></v-icon>

        <h2 class="text-h5 mb-6">Viabilidade</h2>

        <ul>
          <li>
            <p class="text-medium-emphasis text-body-2" v-if="!cardLoader">
              PORTAS DISPONÍVEIS: {{ portsAvailable }}
            </p>
            <p class="text-medium-emphasis text-body-2" v-else>Aguarde</p>
          </li>
        </ul>

        <v-divider class="my-4"></v-divider>
        <div class="text-end">
          <v-btn
            class="text-none"
            color="info"
            rounded
            variant="flat"
            width="90"
            @click="closeDialog"
          >
            Fechar
          </v-btn>
        </div>
      </v-sheet>
    </v-card-text>
  </v-card>
</template>

<style scoped>
ul {
  list-style: none;
}
</style>
