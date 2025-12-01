<script setup>
import { ref, watch } from "vue";
const emit = defineEmits(["selectSaleType"]);

const settingsSelection = ref(["Venda"]);

const items = ref([
  { title: "Venda" },
  { title: "Upgrade" },
  { title: "Novo Ponto" },
]);

watch(settingsSelection, (newSelection) => {
  if (newSelection.length === 0) {
    settingsSelection.value = ["Venda"];
    emit("selectSaleType", ["Venda"]);
  } else {
    emit("selectSaleType", newSelection);
  }
});
</script>

<template>
  <v-menu>
    <template #activator="{ props }">
      <v-btn v-bind="props" icon="mdi-chevron-down" variant="plain"> </v-btn>
    </template>
    <v-list v-model:selected="settingsSelection" select-strategy="leaf">
      <v-list-item
        v-for="(item, index) in items"
        :key="index"
        :value="item.title"
        :title="item.title"
      >
        <template v-slot:prepend="{ isSelected, select }">
          <v-list-item-action start>
            <v-checkbox-btn
              :model-value="isSelected"
              @update:model-value="select"
            ></v-checkbox-btn>
          </v-list-item-action>
        </template>
      </v-list-item>
    </v-list>
  </v-menu>
</template>
