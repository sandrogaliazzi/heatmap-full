<script setup>
import { ref, onMounted, watch } from "vue";
import { getAuditoriaLogsByClient } from "../Auditoria/auditoria";

const client = defineModel();

const logs = ref([]);

const getClientLogs = async () => {
  logs.value = await getAuditoriaLogsByClient(
    client.value.name || client.value.client,
  );
};

watch(client, () => {
  getClientLogs();
});

onMounted(() => {
  getClientLogs();
});
</script>
<template>
  <v-expansion-panels variant="accordion">
    <v-expansion-panel title="Histórico">
      <v-expansion-panel-text>
        <v-list>
          <v-list-item v-for="(item, index) in logs" :key="index">
            <v-list-item-title class="font-weight-bold">
              {{ new Date(item.created_at).toLocaleString("pt-BR") }} -
              {{ item.status }}
            </v-list-item-title>
            <v-list-item-subtitle>{{ item.message }}</v-list-item-subtitle>
            <v-list-item-subtitle
              >Usuário: {{ item.user }}</v-list-item-subtitle
            >
            <v-list-item-subtitle
              >Cliente: {{ item.client }}</v-list-item-subtitle
            >
            <v-list-item-subtitle
              >IP: {{ item.ipAddress }}</v-list-item-subtitle
            >
            <v-divider class="my-2"></v-divider>
          </v-list-item>
        </v-list>
      </v-expansion-panel-text>
    </v-expansion-panel>
  </v-expansion-panels>
</template>
