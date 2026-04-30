<script setup>
import { storeToRefs } from "pinia";
import { useTomodatStore } from "@/stores/tomodat";

defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue"]);

const tomodatStore = useTomodatStore();
const { queryCto } = storeToRefs(tomodatStore);
</script>

<template>
  <v-dialog
    :model-value="modelValue"
    width="420"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card class="pa-4">
      <v-text-field
        v-model="queryCto"
        autofocus
        clearable
        density="comfortable"
        hide-details
        placeholder="Digite o CTO"
        variant="outlined"
      />
    </v-card>
  </v-dialog>
</template>
