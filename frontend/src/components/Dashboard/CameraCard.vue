<script setup>
const { cameras, loading } = defineProps(["cameras", "loading"]);
</script>

<template>
  <v-card class="mx-auto" :loading="loading">
    <v-card-item title="Cameras">
      <template #subtitle>
        Clique em ver mais para lista completa Com todas as Cameras
      </template>
    </v-card-item>

    <v-card-text class="py-0">
      <v-row align="center" no-gutters>
        <v-col cols="6">
          <p class="text-h2">{{ cameras.length }}</p>
          <p class="subtitle">Total de Cameras</p>
        </v-col>

        <v-col cols="6" class="text-right">
          <v-icon color="secondary" icon="mdi-cctv" size="88"></v-icon>
        </v-col>
      </v-row>
    </v-card-text>

    <v-divider></v-divider>

    <v-card-actions>
      <v-btn :to="{ name: 'camera-list' }"> VER MAIS </v-btn>
    </v-card-actions>
  </v-card>
</template>
