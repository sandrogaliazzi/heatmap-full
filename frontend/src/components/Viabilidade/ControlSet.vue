<script setup>
import { useRouter } from "vue-router";
import { useUserStore } from "@/stores/user";
defineEmits([
  "editLocation",
  "toggleDrawer",
  "update:range",
  "update:list",
  "open:reservadosDialog",
  "open:search",
]);

const userStore = useUserStore();

const router = useRouter();

const logout = () => {
  userStore.logout();
  router.push({ name: "Login" }).then(() => {
    router.go(0); // Reload the page to reset the state
  });
};
</script>

<template>
  <v-card
    ><v-card-title>
      <div class="d-flex align-center justify-center ga-2">
        <v-btn
          icon="mdi-magnify"
          size="small"
          variant="flat"
          @click="$emit('open:search')"
          v-role="['adm', 'vendas', 'tecnico']"
        ></v-btn>
        <v-btn
          icon="mdi-map-marker"
          size="small"
          variant="flat"
          @click="$emit('editLocation')"
        ></v-btn>
        <v-btn
          icon="mdi-list-box"
          size="small"
          variant="flat"
          @click="$emit('toggleDrawer')"
        >
        </v-btn>
        <v-btn
          icon="mdi-plus-circle-multiple"
          size="small"
          variant="flat"
          @click="$emit('update:range', true)"
        >
        </v-btn>
        <v-btn
          icon="mdi-minus-circle-multiple"
          size="small"
          variant="flat"
          @click="$emit('update:range', false)"
        >
        </v-btn>
        <v-btn
          icon="mdi-refresh"
          size="small"
          variant="flat"
          @click="$emit('update:list')"
        >
        </v-btn>
        <v-btn
          icon="mdi-account-group"
          size="small"
          variant="flat"
          @click="$emit('open:reservadosDialog')"
        >
        </v-btn>
        <v-btn icon="mdi-logout" size="small" variant="flat" @click="logout">
        </v-btn>
      </div> </v-card-title
  ></v-card>
</template>
