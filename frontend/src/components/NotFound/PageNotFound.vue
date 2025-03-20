<script setup>
import { useRouter } from "vue-router";

const router = useRouter();

const backNavigation = () => router.push("/heatmap");
</script>

<template>
  <v-container>
    <div
      class="d-flex justify-center align-center flex-column"
      style="height: 80vh"
    >
      <v-icon size="150">mdi-web-remove</v-icon>
      <h1 class="text-h1 text-orange">Ops!</h1>
      <p class="font-weight-bold mt-3">Essa Página não existe!</p>
      <v-btn
        class="mt-3"
        variant="tonal"
        color="primary"
        @click="backNavigation"
        >Tire-me daqui</v-btn
      >
    </div>
  </v-container>
</template>
