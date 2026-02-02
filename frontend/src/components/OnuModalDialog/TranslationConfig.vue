<script setup>
import { ref, watch } from "vue";

const { vlanTranslations, portNumber } = defineProps([
  "vlanTranslations",
  "portNumber",
]);
const emit = defineEmits(["setTranslationConfig"]);
const translationConfig = ref([]);
const translationSelection = ref(null);

const checkBoxAccess = ref(false);
const checkBoxDot1q = ref(false);
const checkBoxReplace = ref(false);
const checkBoxTrunk = ref(false);

const inputRules = [
  (value) => {
    if (value) return true;

    return "Este campo é obrigatório";
  },
];

watch(translationSelection, (selection) => {
  selection.entries.forEach((item) => {
    if (item.mode === "ACCESS") {
      checkBoxAccess.value = true;
    }
    if (item.mode === "DOT1Q") {
      checkBoxDot1q.value = true;
    }
    if (item.mode === "REPLACE") {
      checkBoxReplace.value = true;
    }
    if (item.mode === "TRUNK") {
      checkBoxTrunk.value = true;
    }
  });

  emit("setTranslationConfig", {
    translation: selection,
    port: portNumber,
  });
});
</script>

<template>
  <v-col cols="8">
    <div class="d-flex">
      <v-checkbox label="acess" v-model="checkBoxAccess"></v-checkbox>
      <v-checkbox label="dot1q" v-model="checkBoxDot1q"></v-checkbox>
      <v-checkbox label="replace" v-model="checkBoxReplace"></v-checkbox>
      <v-checkbox label="trunk" v-model="checkBoxTrunk"></v-checkbox>
    </div>
  </v-col>
  <v-col cols="4">
    <v-select
      label="SELECIONAR TRANSLATION"
      :items="vlanTranslations"
      :item-title="(item) => item.name"
      :item-value="(item) => item"
      v-model="translationSelection"
      :rules="inputRules"
    ></v-select>
  </v-col>
</template>
