<script setup>
import { ref } from "vue";
defineProps(["ctoList"]);
const drawer = defineModel();
const showList = ref(true);

const calcFreePorts = (splitters) => {
  return splitters
    .map((s) => s.free_ports_number)
    .reduce((acc, cur) => acc + cur, 0);
};
</script>

<template>
  <v-navigation-drawer v-model="drawer" location="bottom" permanent>
    <v-list v-if="ctoList.length > 0" max-height="250" class="overflow-y-auto">
      <v-list-item
        title="Lista de Viabilidade"
        subtitle="Ordenado por distância"
      >
        <template v-slot:append>
          <v-btn
            variant="text"
            :icon="showList ? 'mdi-chevron-down' : 'mdi-chevron-up'"
            @click="showList = !showList"
          ></v-btn>
          <v-btn
            variant="text"
            icon="mdi-close"
            @click="drawer = false"
          ></v-btn>
        </template>
      </v-list-item>
      <v-divider></v-divider>
      <v-list-item
        v-for="cto in ctoList"
        v-if="showList"
        :key="cto.id"
        link
        :title="cto.name"
        :subtitle="`Portas Livres: ${calcFreePorts(cto.splitters)}`"
      >
        <template #append>
          <v-btn
            icon="mdi-lock-open-check"
            size="small"
            v-if="calcFreePorts(cto.splitters) > 0"
            @click="console.log(cto)"
          ></v-btn>
        </template>
      </v-list-item>
    </v-list>
  </v-navigation-drawer>
</template>
