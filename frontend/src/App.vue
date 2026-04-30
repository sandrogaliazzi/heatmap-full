<script setup>
import { storeToRefs } from "pinia";
import { useAuthStore } from "@/stores/auth";
import Notification from "@/components/Notification/Notification";
import LoginExpiredDialog from "@/components/Auth/LoginExpiredDialog.vue";
import QueryCtoDialog from "@/components/Global/QueryCtoDialog.vue";
import SearchCardDialog from "@/components/Global/SearchCardDialog.vue";

import { computed, onBeforeUnmount, onMounted, provide, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useRoute } from "vue-router";

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();
const isDarkTheme = ref(true);
const isHeatMapRoute = computed(() => route.name === "HeatMap");

const openLoginModal = ref(false);
const openQueryCtoModal = ref(false);
const openSearchCardModal = ref(false);

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

const isTypingContext = (target) => {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return Boolean(
    target.closest("input, textarea, select, [contenteditable='true']"),
  );
};

const handleGlobalKeydown = (event) => {
  if (
    event.defaultPrevented ||
    event.repeat ||
    event.metaKey ||
    event.altKey
  ) {
    return;
  }

  if (event.key.toLowerCase() !== "f") {
    return;
  }

  if (event.ctrlKey) {
    event.preventDefault();
    openSearchCardModal.value = true;
    return;
  }

  if (isTypingContext(event.target)) {
    return;
  }

  openQueryCtoModal.value = true;
};

onMounted(() => {
  window.addEventListener("keydown", handleGlobalKeydown);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleGlobalKeydown);
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
    <QueryCtoDialog v-model="openQueryCtoModal" />
    <SearchCardDialog v-model="openSearchCardModal" @update:modelValue="openSearchCardModal = $event"                                                                  />
    <LoginExpiredDialog
      v-model="openLoginModal"
      @login="login"
    />
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
