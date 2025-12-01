<script setup>
import { computed } from "vue";
const { title, metric, numberOfSales } = defineProps([
  "title",
  "metric",
  "numberOfSales",
]);

const salesProgress = computed(() => {
  return numberOfSales - metric >= 0 ? 100 : (numberOfSales / metric) * 100;
});
</script>

<template>
  <v-col>
    <v-card
      :color="parseInt(metric) - parseInt(numberOfSales) <= 0 ? 'success' : ''"
      class="rounded-xl mx-3"
      elevation="8"
    >
      <v-card-title>
        <v-progress-linear
          color="primary"
          rounded
          class="my-3"
          v-if="metric - numberOfSales > 0"
          :model-value="salesProgress"
        ></v-progress-linear>
        <div class="d-flex justify-space-between">
          <p>{{ title.toLowerCase() }}</p>
          <p>{{ numberOfSales }}/{{ metric }}</p>
        </div>
      </v-card-title>
      <v-card-text class="d-flex justify-end">
        {{
          parseInt(metric) - parseInt(numberOfSales) <= 0
            ? "META CONCLUÍDA"
            : `FALTAM ${parseInt(metric) - parseInt(numberOfSales)}`
        }}
      </v-card-text>
    </v-card>
  </v-col>
</template>
