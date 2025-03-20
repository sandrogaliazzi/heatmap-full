<script setup>
const { logs, loading } = defineProps(["logs", "loading"]);
</script>

<template>
  <v-card class="mx-auto">
    <v-card-item title="Ativações">
      <template #subtitle>
        Clique em ver mais para lista completa de ativações
      </template>
    </v-card-item>

    <v-card-text class="py-0">
      <v-row align="center" no-gutters>
        <v-col cols="6">
          <p class="text-h2">{{ logs.length }}</p>
          <p class="subtitle">Total de ativações</p>
        </v-col>

        <v-col cols="6" class="text-right">
          <v-icon color="primary" icon="mdi-web" size="88"></v-icon>
        </v-col>
      </v-row>
    </v-card-text>

    <v-divider></v-divider>

    <v-card-actions>
      <v-btn :to="{ name: 'logs-list' }"> VER MAIS </v-btn>
    </v-card-actions>
  </v-card>
</template>
