<script setup>
import ListItem from "./ListItem.vue";

defineProps(["results", "query", "isDesktop"]);
</script>

<template>
  <v-list nav>
    <v-list-subheader class="mb-3">
      Resultados para: {{ query }}
    </v-list-subheader>
    <v-virtual-scroll
      :items="results"
      class="overflow-y-auto"
      :max-height="isDesktop ? '500px' : '300px'"
    >
      <template #="{ item }">
        <ListItem :source="item" />
      </template>
    </v-virtual-scroll>
  </v-list>
</template>
