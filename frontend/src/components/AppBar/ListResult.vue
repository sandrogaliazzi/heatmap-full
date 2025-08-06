<script setup>
import ListItem from "./ListItem.vue";

defineProps(["results", "query"]);
</script>

<template>
  <v-list nav>
    <v-list-subheader class="mb-3">
      Resultados para: {{ query }}
    </v-list-subheader>
    <v-virtual-scroll height="600" :items="results">
      <template #="{ item }">
        <ListItem :source="item" />
      </template>
    </v-virtual-scroll>
  </v-list>
</template>
