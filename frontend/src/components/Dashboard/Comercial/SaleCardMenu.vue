<script setup>
import { ref } from "vue";
const emit = defineEmits(["selectSaleType"]);

const items = ref([
  { title: "Venda" },
  { title: "Upgrade" },
  { title: "Novo Ponto" },
]);
</script>

<template>
  <v-menu>
    <template #activator="{ props }">
      <v-btn v-bind="props" icon="mdi-chevron-down" variant="plain"> </v-btn>
    </template>
    <v-list>
      <v-list-item v-for="(item, index) in items" :key="index" :value="index">
        <v-list-item-title @click="emit('selectSaleType', item.title)">{{
          item.title
        }}</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-menu>
</template>
