<script setup>
defineProps(["cto", "slideNumber", "isMapVisible", "userLocation"]);

const emit = defineEmits([
  "openLocation",
  "openDiagram",
  "toggleUserLocation",
  "toggleHistory",
  "goAddClient",
  "goBack",
  "toggleMap",
  "close",
]);
</script>

<template>
  <v-card-title
    class="d-flex flex-column flex-md-row justify-space-between align-center border-b"
    :class="cto.color === '#00ff00' ? 'bg-green' : 'bg-orange'"
  >
    <p style="cursor: pointer" @click="emit('openLocation', cto.coord)">
      {{ cto.color === "#00ff00" ? "$" : "#" }}{{ cto.name }}
    </p>
    <div>
      <v-btn icon="mdi-sitemap" variant="text" @click="emit('openDiagram')" />
      <v-btn
        icon="mdi-map-marker"
        :color="userLocation ? 'red' : ''"
        variant="text"
        @click="emit('toggleUserLocation')"
        size="small"
      />
      <v-btn
        variant="plain"
        icon="mdi-history"
        @click="emit('toggleHistory')"
      />
      <v-btn
        v-if="slideNumber < 2"
        icon="mdi-account-plus"
        variant="plain"
        @click="emit('goAddClient')"
      />
      <v-btn
        v-else
        icon="mdi-chevron-left"
        variant="plain"
        @click="emit('goBack')"
      />
      <v-btn
        v-if="slideNumber < 2"
        variant="plain"
        :icon="`${isMapVisible ? 'mdi-eye' : 'mdi-eye-off'}`"
        @click="emit('toggleMap')"
      />
      <v-btn variant="plain" icon="mdi-close" @click="emit('close')" />
    </div>
  </v-card-title>
</template>
