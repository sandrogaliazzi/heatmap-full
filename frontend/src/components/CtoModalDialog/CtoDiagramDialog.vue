<script setup>
import { computed, ref } from "vue";

import ShowApConnDiagram from "../CtoDiagram/ShowApConnDiagram.vue";

const props = defineProps([
  "modelValue",
  "ctoName",
  "loadingConnections",
  "connections",
]);
const emit = defineEmits(["update:modelValue"]);

const diagram = ref(null);

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});
</script>

<template>
  <v-dialog v-model="isOpen" :fullscreen="true" scrollable>
    <v-toolbar color="orange">
      <v-toolbar-title>{{ ctoName }}</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn
        icon="mdi-magnify-plus"
        variant="text"
        @click="diagram?.zoomIn()"
      />
      <v-btn
        icon="mdi-magnify-minus"
        variant="text"
        @click="diagram?.zoomOut()"
      />
      <v-btn icon="mdi-close" variant="text" @click="isOpen = false" />
    </v-toolbar>
    <ShowApConnDiagram
      v-if="!loadingConnections"
      :connections="connections"
      ref="diagram"
    />
    <v-sheet
      v-else
      :height="400"
      class="d-flex justify-center align-center"
    >
      <v-progress-circular
        color="orange"
        indeterminate
        :size="96"
        :width="6"
      />
    </v-sheet>
  </v-dialog>
</template>
