<script setup>
import { ref, onMounted } from "vue";
import fetchApi from "@/api";

const { cto } = defineProps(["cto"]);

const reservados = ref([]);

const findReservados = async () => {
  try {
    const response = await fetchApi.get(`/reservados`);
    reservados.value = response.data.filter((r) => r.cto_id === cto.id);
  } catch (error) {
    console.error("Erro ao buscar reservados:", error);
  }
};

const deleteReservado = async (reservado) => {
  if (!confirm("Tem certeza que deseja deletar essa reserva?")) {
    return;
  }
  try {
    const response = await fetchApi.delete(
      `/reservados/${reservado._id}/${reservado.tomodat_id}`
    );
    if (response.status === 200) {
      alert("Reserva deletado com sucesso!");
      findReservados();
    }
  } catch (error) {
    console.error("Erro ao deletar reservado:", error);
  }
};

onMounted(() => {
  findReservados();
});
</script>

<template>
  <v-list v-if="reservados.length > 0">
    <v-list-subheader>RESERVADOS</v-list-subheader>
    <v-list-item
      v-for="reservado in reservados"
      :key="reservado.id"
      :title="reservado.name"
    >
      <template #append>
        <v-btn
          prepend-icon="mdi-delete"
          @click="deleteReservado(reservado)"
          color="error"
          size="small"
          >reserva</v-btn
        >
      </template>
    </v-list-item>
  </v-list>
  <p v-else>SEM RESERVADOS</p>
</template>
