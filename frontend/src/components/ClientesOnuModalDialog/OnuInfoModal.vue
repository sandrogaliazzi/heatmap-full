<script setup>
import { ref, onMounted, inject } from "vue";
import fetchApi from "@/api";
import { useNotificationStore } from "@/stores/notification";
import { getApiErrorMessage } from "@/utils/apiError";

const props = defineProps({
  onu: {
    type: Object,
    required: true,
  },
});

const notification = useNotificationStore();

const loading = ref(false);
const onuInfo = ref(null);
const closeDialog = inject("closeDialog");
const tab = ref("runningConfig");

const fetchOnuInfo = async () => {
  try {
    loading.value = true;
    const response = await fetchApi.post("/verificar-onu-info", {
      oltIp: props.onu.oltIp,
      mac: props.onu.mac,
    });
    onuInfo.value = response.data;
  } catch (error) {
    notification.setNotification({
      msg: getApiErrorMessage(
        error,
        "Não foi possível carregar as informações da ONU.",
      ),
      status: "error",
    });
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchOnuInfo();
});
</script>

<template>
  <v-card
    title="ONU INFO"
    :subtitle="`${props.onu.mac} - olt: ${props.onu.oltIp}`"
    prepend-icon="mdi-information-outline"
    :loading="loading"
  >
    <template #append>
      <v-btn icon="mdi-close" @click="closeDialog" variant="text"></v-btn>
    </template>
    <v-card-text>
      <v-tabs v-model="tab" color="orange">
        <v-tab value="runningConfig">Configuração em Execução</v-tab>
        <v-tab value="summary">Resumo</v-tab>
        <v-tab value="information">Informações</v-tab>
      </v-tabs>

      <v-divider></v-divider>

      <v-tabs-window v-model="tab">
        <v-tabs-window-item value="runningConfig">
          <v-sheet class="pa-5">
            <pre>
              {{ onuInfo?.runningConfig }}
            </pre>
          </v-sheet>
        </v-tabs-window-item>
        <v-tabs-window-item value="summary">
          <v-sheet class="pa-5">
            <pre>
              {{ onuInfo?.summary }}
            </pre>
          </v-sheet>
        </v-tabs-window-item>
        <v-tabs-window-item value="information">
          <v-sheet class="pa-5">
            <pre>
              {{ onuInfo?.information }}
            </pre>
          </v-sheet>
        </v-tabs-window-item>
      </v-tabs-window>
    </v-card-text>
    <v-card-actions>
      <v-btn @click="closeDialog">Fechar</v-btn>
    </v-card-actions>
  </v-card>
</template>
