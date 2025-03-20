<script setup>
const { users, loading } = defineProps(["users", "loading"]);
</script>

<template>
  <v-card class="mx-auto" :loading="loading">
    <v-card-item title="Usuários">
      <template #subtitle> Clique em ver mais para lista completa </template>
    </v-card-item>

    <v-card-text class="py-0">
      <v-row align="center" no-gutters>
        <v-col class="text-h2" cols="6"> {{ users.length }} </v-col>

        <v-col cols="6" class="text-right">
          <v-icon color="orange" icon="mdi-account-group" size="88"></v-icon>
        </v-col>
      </v-row>
    </v-card-text>

    <v-divider></v-divider>

    <v-card-actions>
      <v-btn :to="{ name: 'user-list' }"> VER MAIS </v-btn>
    </v-card-actions>
  </v-card>
</template>
