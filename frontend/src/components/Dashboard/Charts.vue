<script setup>
import { ref, watch } from "vue";
import LogsChart from "./LogsChart.vue";
import DialogBox from "../Dialog/Dialog.vue";
import LogsFilterCard from "./LogsFilterCard.vue";

const dialog = ref(false);
const nextKey = ref(1);
const loadingChart = ref(true);
const selectedDate = ref(null);

const handleDateSelection = (val) => {
  selectedDate.value = val;
  dialog.value = false;
};

watch(selectedDate, () => {
  forceChartRender();
});

const onCloseDialog = (value) => (dialog.value = value);

const forceChartRender = () => {
  nextKey.value++;
  loadingChart.value = true;
};
</script>

<template>
  <v-row justify="center">
    <v-col cols="12">
      <v-banner icon="mdi-alert" lines="one" color="orange" class="my-4">
        <v-banner-text>
          Os gráficos podem sofrer erros de carregamento, neste caso clique em
          recarregar
        </v-banner-text>
        <template v-slot:actions>
          <v-btn
            prepend-icon="mdi-reload"
            color="orange"
            @click="forceChartRender"
            >Recarregar</v-btn
          >
        </template>
      </v-banner>
    </v-col>
    <v-col cols="12">
      <v-card variant="tonal" color="primary" :loading="loadingChart">
        <DialogBox :isOpen="dialog" @update:modal-value="onCloseDialog">
          <LogsFilterCard
            @update:close-dialog="dialog = false"
            @update:clear-filter-date="selectedDate = null"
            @update:set-filter-date="handleDateSelection"
          />
        </DialogBox>
        <v-card-title class="d-flex justify-space-between align-center">
          <p>Numero de Ativaçõs por cidade</p>
          <v-btn
            variant="tonal"
            color="secondary"
            append-icon="mdi-filter"
            @click="dialog = true"
            >Filtro</v-btn
          >
        </v-card-title>
        <template v-slot:loader="{ isActive }">
          <v-progress-linear
            :active="isActive"
            color="orange"
            height="4"
            indeterminate
          ></v-progress-linear>
        </template>
        <v-card-text>
          <Suspense>
            <LogsChart
              :key="nextKey"
              :selectedDate="selectedDate"
              @update:loading="loadingChart = false"
            />
            <template #fallback>
              <h2>Loading chart...</h2>
            </template>
          </Suspense>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>
