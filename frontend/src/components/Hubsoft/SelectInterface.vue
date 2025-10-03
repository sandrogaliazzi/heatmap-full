<script setup>
import { ref, watch, onMounted } from "vue";
import hubApi from "@/api/hubsoftApi";

const selectedInterface = ref(null);
const interfaces = ref([]);
const emit = defineEmits(["interface-selected"]);

const inputRules = [
  (value) => {
    if (value) return true;

    return "Este campo é obrigatório";
  },
];

const loadInterfaces = async () => {
  try {
    const response = await hubApi.get("api/v1/integracao/rede/equipamento");
    if (response.status === 200) {
      interfaces.value = response.data.equipamentos
        .map((equip) =>
          equip.interfaces.map((interface_) => ({
            ...interface_,
            nome_equipamento: equip.nome,
          }))
        )
        .flat();
    }
  } catch (error) {
    console.log("erro ao buscar interfaces", error.message);
  }
};

watch(selectedInterface, (newInterface) => {
  if (newInterface) {
    emit("interface-selected", newInterface);
  }
});

onMounted(() => {
  loadInterfaces();
});
</script>

<template>
  <v-autocomplete
    v-model="selectedInterface"
    :rules="inputRules"
    clearable
    label="INTERFACE"
    :items="interfaces || []"
    :item-title="(item) => `${item.nome} - ${item.nome_equipamento}`"
    :item-value="(item) => item.id_interface_conexao"
    prepend-inner-icon="mdi-hdmi-port"
    placeholder="Selecione a interface"
  ></v-autocomplete>
</template>
