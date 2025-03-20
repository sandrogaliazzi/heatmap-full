import { defineStore } from "pinia";
import { ref } from "vue";

export const useNotificationStore = defineStore("notification", () => {
  const showNotification = ref(false);
  const notificationMessage = ref("");
  const notificationStatus = ref("success");

  const setNotification = ({ show = true, msg, status }) => {
    (showNotification.value = show),
      (notificationMessage.value = msg),
      (notificationStatus.value = status);
  };

  return {
    setNotification,
    showNotification,
    notificationMessage,
    notificationStatus,
  };
});
