<script setup>
const emit = defineEmits(["open-search"]);
</script>

<template>
  <v-btn
    class="floating-fab"
    color="orange"
    icon="mdi-magnify"
    size="large"
    elevation="8"
    aria-label="Pesquisar"
    @click="emit('open-search')"
  />
</template>

<style scoped>
.floating-fab {
  position: fixed;
  right: 16px;
  bottom: calc(16px + env(safe-area-inset-bottom));
  z-index: 1100;
}
</style>
