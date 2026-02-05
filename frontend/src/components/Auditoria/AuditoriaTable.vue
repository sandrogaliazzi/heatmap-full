<script setup>
import { ref } from "vue";
defineProps({
  items: {
    type: Array,
    required: true,
  },
});

const search = ref("");

const headers = [
  {
    title: "Data",
    key: "created_at",
    value: (item) => new Date(item.created_at).toLocaleString("pt-BR"),
  },
  { title: "Log", key: "message" },
  { title: "Usuário", key: "user" },
  { title: "Cliente", key: "client" },
  { title: "ip", key: "ipAddress" },
];
</script>

<template>
  <v-text-field
    v-model="search"
    label="Pesquisar"
    prepend-inner-icon="mdi-magnify"
    variant="outlined"
    hide-details
    single-line
    class="my-3"
  ></v-text-field>
  <v-data-table :headers="headers" :items="items" :search="search">
  </v-data-table>
</template>
