<script setup>
import { useNotificationStore } from "@/stores/notification";
import { storeToRefs } from "pinia";

const notification = useNotificationStore();
const { showNotification, notificationMessage, notificationStatus } =
  storeToRefs(notification);
</script>

<template>
  <v-snackbar
    v-model="showNotification"
    :color="notificationStatus"
    timeout="3000"
    location="top"
  >
    {{ notificationMessage }}
  </v-snackbar>
</template>
