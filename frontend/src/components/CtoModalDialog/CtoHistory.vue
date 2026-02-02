<script setup>
import { ref, onMounted } from "vue";
import { getAuditoriaLogsByCtoId } from "../Auditoria/auditoria";

const { ctoId } = defineProps(["ctoId"]);

const items = ref([]);

onMounted(async () => {
  items.value = await getAuditoriaLogsByCtoId(ctoId);
});
</script>

<template>
  <v-list>
    <v-list-item v-for="(item, index) in items" :key="index">
      <v-list-item-title class="font-weight-bold">
        {{ new Date(item.created_at).toLocaleString("pt-BR") }} -
        {{ item.status }}
      </v-list-item-title>
      <v-list-item-subtitle>{{ item.message }}</v-list-item-subtitle>
      <v-list-item-subtitle>Usuário: {{ item.user }}</v-list-item-subtitle>
      <v-list-item-subtitle>Cliente: {{ item.client }}</v-list-item-subtitle>
      <v-list-item-subtitle>IP: {{ item.ipAddress }}</v-list-item-subtitle>
      <v-divider class="my-2"></v-divider>
    </v-list-item>
  </v-list>
</template>
