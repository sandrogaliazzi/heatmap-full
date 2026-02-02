<script setup>
defineProps({
  items: {
    type: Array,
    required: true,
  },
});

const statusColors = {
  success: "green",
  error: "red",
  warning: "orange",
};

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
  { title: "Status", key: "status" },
];
</script>

<template>
  <v-data-table :headers="headers" :items="items">
    <template #item.status="{ item }">
      <v-chip color="grey" dark small>
        {{ item.status }}
      </v-chip>
    </template>
  </v-data-table>
</template>
