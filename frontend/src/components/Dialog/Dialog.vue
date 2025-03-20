<script setup>
import { defineProps, defineEmits, computed, provide } from "vue";
import { useWindowSize } from "vue-window-size";

const props = defineProps(["isOpen", "isFull"]);
const emit = defineEmits(["update:modalValue"]);

const isDialogOpen = computed({
  get() {
    return props.isOpen;
  },

  set(value) {
    emit("update:modalValue", value);
  },
});

const closeDialog = () => emit("update:modalValue", false);

provide("closeDialog", closeDialog);

const { width } = useWindowSize();
</script>

<template>
  <div class="text-center">
    <v-dialog
      v-model="isDialogOpen"
      transition="dialog-top-transition"
      scrim="grey-darken-4"
      :maxWidth="props.isFull ? '' : '600px'"
      scrollable
      :fullscreen="width < 600 || props.isFull ? true : false"
    >
      <slot></slot>
    </v-dialog>
  </div>
</template>
