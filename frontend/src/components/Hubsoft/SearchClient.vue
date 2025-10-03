<script setup>
import { ref, watch } from "vue";
import hubApi from "@/api/hubsoftApi";

const clientsFound = ref([]);
const search = ref("");
const selectedClient = ref(null);

const emit = defineEmits(["client-selected"]);

const inputRules = [
  (value) => {
    if (value) return true;

    return "Este campo é obrigatório";
  },
];

const debounce = (fn, delay) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      fn(...args);
    }, delay);
  };
};

const loadingClients = ref(false);

const searchClientByName = debounce(async (alias) => {
  if (alias.length < 3) return;
  console.log("buscando cliente", alias);
  loadingClients.value = true;
  try {
    const response = await hubApi.get(
      `api/v1/integracao/cliente?busca=nome_razaosocial&termo_busca=${alias}&relacoes=endereco_instalacao`
    );
    if (response.status === 200) {
      clientsFound.value = response.data.clientes;
      console.log("clientes encontrados", clientsFound.value);
    }
  } catch (error) {
    console.log("erro ao buscar cliente", error.message);
  } finally {
    loadingClients.value = false;
  }
}, 500);

watch(search, searchClientByName);
watch(selectedClient, (newClient) => {
  if (newClient) {
    emit("client-selected", newClient);
  }
});
</script>
<template>
  <v-autocomplete
    v-model="selectedClient"
    :rules="inputRules"
    clearable
    @update:search="search = $event"
    label="CLIENTE"
    :items="clientsFound || []"
    :item-title="(item) => item.nome_razaosocial"
    :item-value="(item) => item"
    prepend-inner-icon="mdi-account"
    placeholder="Digite o nome da cliente"
    :loading="loadingClients"
  ></v-autocomplete>
</template>
