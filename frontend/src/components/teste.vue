<script setup>
import { onMounted } from "vue";
import { useTomodatStore } from "@/stores/tomodat";
import { storeToRefs } from "pinia";
const tomodatStore = useTomodatStore();
const { query } = storeToRefs(tomodatStore);

onMounted(() => tomodatStore.getTomodatData());
</script>

<template>
  <v-card>
    <v-card-text class="bg-red"> </v-card-text>
  </v-card>
</template>
