<script setup>
import { ref } from "vue";
const emit = defineEmits(["toggleVisibility"]);

const { isVisible } = defineProps({
  isVisible: {
    type: Boolean,
    required: true,
  },
});

const eyeOn = ref(isVisible);
</script>
<template>
  <v-btn
    variant="text"
    :icon="eyeOn ? 'mdi-eye' : 'mdi-eye-off'"
    @click="
      eyeOn = !eyeOn;
      emit('toggleVisibility', eyeOn);
    "
  ></v-btn>
</template>
