<script setup>
import { ref, inject, onMounted, computed } from "vue";
import { useNotificationStore } from "@/stores/notification";
import fetchApi from "@/api";
const { user, searchTerm } = defineProps(["user", "searchTerm"]);

const reservado = ref(searchTerm || null);
const closeDialog = inject("closeDialog");
const reservados = ref([]);
const notification = useNotificationStore();
const isLoading = ref(true);

const getReservados = async () => {
  try {
    isLoading.value = true;
    const response = await fetchApi("reservados");
    reservados.value = user
      ? response.data.filter((r) => r.user === user.name)
      : response.data;
  } catch (error) {
    console.error("Erro ao obter reservados:", error);
  } finally {
    isLoading.value = false;
  }
};

const filteredReservados = computed(() => {
  if (!reservado.value) {
    return reservados.value;
  }

  return reservados.value.filter((r) =>
    r.name.toLowerCase().includes(reservado.value.toLowerCase())
  );
});

const openNewGMapTab = (reserva) => {
  const url = `https://www.google.com/maps/search/?api=1&query=${reserva.coord.lat},${reserva.coord.lng}`;
  const win = window.open(url, "_blank");
  win.focus();
};

const deleteReservado = async (reserva) => {
  try {
    await fetchApi.delete(`/reservados/${reserva._id}/${reserva.tomodat_id}`);
    notification.setNotification({
      status: "success",
      msg: `Reserva de ${reserva.name} removida com sucesso!`,
    });
    getReservados();
  } catch (error) {
    console.error("Erro ao remover reserva:", error);
    notification.setNotification({
      status: "error",
      msg: "Erro ao remover reserva.",
    });
  }
};

const renewReservado = async (reserva) => {
  try {
    const response = await fetchApi.put(`/reservados/${reserva._id}`, {
      ...reserva,
      created_at: new Date().toISOString(),
    });
    notification.setNotification({
      status: "success",
      msg: `Reserva de ${reserva.name} renovada com sucesso!`,
    });
    getReservados();
  } catch (error) {
    console.error("Erro ao renovar reserva:", error);
    notification.setNotification({
      status: "error",
      msg: "Erro ao renovar reserva.",
    });
  }
};

onMounted(async () => {
  await getReservados();
});
</script>

<template>
  <v-card style="min-height: 400px" :loading="isLoading">
    <slot name="header">
      <v-card-title class="bg-orange">
        <div class="d-flex justify-space-between align-center">
          <div class="d-flex">
            <p class="me-2">Reservados</p>
            <v-icon>mdi-account-lock</v-icon>
          </div>
          <div>
            <v-btn
              variant="text"
              icon="mdi-reload"
              @click="getReservados"
            ></v-btn>
            <v-btn variant="text" icon="mdi-close" @click="closeDialog"></v-btn>
          </div>
        </div>
      </v-card-title>
    </slot>
    <v-card-text>
      <v-row justify="center" v-if="!isLoading">
        <v-col cols="12" class="fixed-column">
          <v-text-field
            variant="outlined"
            type="text"
            label="Pesquisar reserva"
            v-model="reservado"
            single-line
          >
          </v-text-field>
        </v-col>
        <v-col cols="12" class="scrollable-column">
          <v-list nav>
            <v-list-subheader>Lista de Reservados</v-list-subheader>
            <div v-if="reservado && !filteredReservados.length">
              <v-list-item>
                <div class="d-flex justify-center align-center text-center">
                  <div>
                    <v-icon size="100px">mdi-email-search</v-icon>
                    <p class="text-center text-h5">
                      Nenhum resultado correspondente a {{ reservado }}
                    </p>
                  </div>
                </div>
              </v-list-item>
            </div>
            <div v-else>
              <v-list-item
                v-for="reserva in filteredReservados || reservados"
                :title="reserva.name"
                :subtitle="`Reservado por: ${reserva.user} | Data: ${new Date(
                  reserva.created_at
                ).toLocaleDateString()}`"
                :value="reserva._id"
                :key="reserva._id"
                prepend-icon="mdi-account"
              >
                <template #append>
                  <v-btn icon="mdi-dots-vertical" variant="text">
                    <v-icon>mdi-dots-vertical</v-icon>
                    <v-menu activator="parent" location="bottom">
                      <v-list>
                        <v-list-item
                          prepend-icon="mdi-delete"
                          @click="deleteReservado(reserva)"
                          title="Remover reserva"
                        />
                        <v-list-item
                          prepend-icon="mdi-map-marker"
                          @click="openNewGMapTab(reserva)"
                          title="Ver no maps"
                        />
                      </v-list>
                    </v-menu>
                  </v-btn>
                </template>
              </v-list-item>
            </div>
          </v-list>
        </v-col>
      </v-row>
      <div
        style="height: 300px"
        class="d-flex justify-center align-center"
        v-else
      >
        <v-progress-circular
          color="orange"
          indeterminate
          :size="128"
          :width="6"
        ></v-progress-circular>
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.fixed-column {
  position: sticky;
  top: 0;
}

.scrollable-column {
  max-height: 80vh; /* Set the maximum height for the scrollable column */
  overflow-y: auto; /* Enable vertical scrolling when content exceeds the max height */
}
</style>
