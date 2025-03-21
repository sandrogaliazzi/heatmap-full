<script setup>
import { onMounted } from "vue";

import AppBar from "@/components/AppBar/AppBar.vue";
import HeatMap from "@/components/HeatMap/HeatMap.vue";
import { useAuthStore } from "@/stores/auth";

const auth = useAuthStore();

onMounted(() => {
  auth.startTokenMonitoring();
});
</script>

<template>
  <AppBar />
  <HeatMap />
</template>
