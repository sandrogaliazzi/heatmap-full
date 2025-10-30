<script setup>
import { ref, onMounted } from "vue";
import hubSoftApi from "@/api/hubsoftApi.js";
import { useNotificationStore } from "@/stores/notification";

const { event } = defineProps(["event"]);
const emit = defineEmits(["close-marker"]);

const alertInfo = ref(null);
const notification = useNotificationStore();
const getHubsoftAlertById = async (id_alerta) => {
  try {
    const response = await hubSoftApi.get(
      `/api/v1/integracao/configuracao/alerta/paginado/10?pagina=1`
    );
    if (response.data.status === "success") {
      const alerta = response.data.alertas.data.find(
        (alerta) => alerta.id_alerta === id_alerta
      );
      return alerta || null;
    }
  } catch (error) {
    console.log("erro ao buscar alerta", error.message);
  }
};

const editAlert = async () => {
  try {
    const payload = {
      descricao: alertInfo.value.descricao,
      visivel_via_api: alertInfo.value.visivel_via_api,
    };
    const response = await hubSoftApi.put(
      `/api/v1/integracao/configuracao/alerta/${alertInfo.value.id_alerta}`,
      payload
    );
    if (response.data.status === "success") {
      console.log("Alerta atualizado com sucesso");
      notification.setNotification({
        status: "success",
        msg: "Alerta atualizado com sucesso",
      });
      emit("close-marker");
    }
  } catch (error) {
    console.log("erro ao editar alerta", error.message);
    notification.setNotification({
      status: "error",
      msg: "Erro ao atualizar alerta",
    });
  }
};

onMounted(async () => {
  console.log("event", event);
  alertInfo.value = await getHubsoftAlertById(event.alerta_id);
});
</script>

<template>
  <v-card>
    <v-card-text>
      <div v-if="alertInfo">
        <v-switch
          v-model="alertInfo.visivel_via_api"
          label="Notifica Upchat"
          color="pink"
        ></v-switch>
        <v-textarea v-model="alertInfo.descricao"></v-textarea>
      </div>
      <div v-else class="d-flex flex-column align-center">
        <v-progress-circular
          size="128"
          color="pink"
          indeterminate
        ></v-progress-circular>
        <p class="mt-3 text-body">Carregando...</p>
      </div>
    </v-card-text>
    <v-card-actions>
      <v-btn color="pink" @click="editAlert" :disabled="!alertInfo"
        >ATUALIZAR</v-btn
      >
      <v-btn @click="$emit('close-marker')">fechar</v-btn>
    </v-card-actions>
  </v-card>
</template>
