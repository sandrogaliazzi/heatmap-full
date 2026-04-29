<script setup>
import { storeToRefs } from "pinia";
import { useAuthStore } from "@/stores/auth";
import Notification from "@/components/Notification/Notification";

import { computed, provide, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useRoute } from "vue-router";

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();
const isDarkTheme = ref(true);
const isHeatMapRoute = computed(() => route.name === "HeatMap");

const openLoginModal = ref(false);

const setAppTheme = () => {
  isDarkTheme.value = !isDarkTheme.value;
};

provide("changeTheme", setAppTheme);

const { tokenExpired } = storeToRefs(auth);

watch(tokenExpired, (newValue) => {
  if (newValue && route.name !== "Login") {
    console.log("Token expirado, abrindo modal de login.");
    openLoginModal.value = true;
  }
});

const login = () => {
  tokenExpired.value = false;
  localStorage.removeItem("user");
  localStorage.removeItem("token");
  router.push({ name: "Login" }).then(() => {
    router.go(0); // Reload the page to reset the state
  });
};
</script>

<template>
  <v-app
    :theme="isDarkTheme ? 'dark' : 'light'"
    class="bg-grey-darken-4"
    :class="{ 'heatmap-app': isHeatMapRoute }"
  >
    <v-main>
      <router-view></router-view>
      <!-- <teste /> -->
    </v-main>
    <Notification />
    <v-dialog v-model="openLoginModal" persistent width="auto">
      <v-sheet
        class="pa-4 text-center mx-auto"
        elevation="12"
        max-width="600"
        rounded="lg"
        width="100%"
      >
        <v-icon
          class="mb-5"
          color="error"
          icon="mdi-alert-circle"
          size="112"
        ></v-icon>

        <h2 class="text-h5 mb-6">Seu Login expirou!</h2>

        <p class="mb-4 text-medium-emphasis text-body-2">
          É necessário fazer login novamente
          <br />
        </p>

        <v-divider class="mb-4"></v-divider>

        <div class="text-end">
          <v-btn
            class="text-none"
            color="orange"
            variant="flat"
            rounded
            to="/login"
            @click="login"
          >
            Fazer Login
          </v-btn>
        </div>
      </v-sheet>
    </v-dialog>
  </v-app>
</template>

<style>
html,
body,
#app {
  height: 100%;
}

.heatmap-app {
  overflow: hidden;
}

.heatmap-app .v-main {
  overflow: hidden;
}

::-webkit-scrollbar {
  width: 8px;
}

/* Track */
::-webkit-scrollbar-track {
  background: #212121;
}

/* Handle */
::-webkit-scrollbar-thumb {
  background: #4b4b4b;
  border-radius: 10px;
}

/* Handle on hover */
::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>
