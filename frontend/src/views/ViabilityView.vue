<script setup>
import Viability from "@/components/Viabilidade/Viability.vue";
import { onMounted } from "vue";
import { useAuthStore } from "@/stores/auth";

const auth = useAuthStore();

onMounted(() => {
  auth.startTokenMonitoring();
});
</script>

<template><Viability /></template>
