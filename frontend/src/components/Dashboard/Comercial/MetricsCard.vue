<script setup>
import { computed } from "vue";
const { title, metric, numberOfSales } = defineProps([
  "title",
  "metric",
  "numberOfSales",
]);
</script>

<template>
  <v-col>
    <v-card
      :color="parseInt(metric) - parseInt(numberOfSales) <= 0 ? 'success' : ''"
      class="rounded-xl"
    >
      <v-card-title>
        <div class="d-flex justify-space-between">
          <p>{{ title }}</p>
          <p>{{ numberOfSales }}/{{ metric }}</p>
        </div>
      </v-card-title>
      <v-card-text class="d-flex justify-end" style="font-size: 1rem">
        {{
          parseInt(metric) - parseInt(numberOfSales) <= 0
            ? "META CONCLUÍDA"
            : `FALTAM ${parseInt(metric) - parseInt(numberOfSales)}`
        }}
      </v-card-text>
    </v-card>
  </v-col>
</template>
