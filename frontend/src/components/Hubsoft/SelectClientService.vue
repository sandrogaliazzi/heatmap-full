<script setup>
import { ref, watch, onMounted } from "vue";

const selectedService = ref(null);
const selectedClient = defineModel();
const emit = defineEmits(["service-selected"]);

const inputRules = [
  (value) => {
    if (value) return true;

    return "Este campo é obrigatório";
  },
];

watch(selectedService, (newService) => {
  if (newService) {
    emit("service-selected", newService);
  }
});

onMounted(() => {
  console.log("selectedClient prop:", selectedClient);
});
</script>

<template>
  <v-select
    label="SELECIONAR SERVIÇO"
    :items="selectedClient.servicos"
    :item-title="
      (item) => item.login || item.nome + ' (serviço sem autenticação)'
    "
    :item-value="(item) => item"
    :rules="inputRules"
    prepend-inner-icon="mdi-wifi"
    v-model="selectedService"
  ></v-select>
</template>
