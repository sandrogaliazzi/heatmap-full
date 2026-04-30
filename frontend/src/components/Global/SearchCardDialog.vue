<script setup>
import SearchCard from "@/components/AppBar/SearchCard.vue";
import { provide } from "vue";

provide("closeDialog", () => {
  emit("update:modelValue", false);
});

defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue"]);
</script>

<template>
  <v-dialog
    :model-value="modelValue"
    max-width="700"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <SearchCard :isDesktop="true" />
  </v-dialog>
</template>
