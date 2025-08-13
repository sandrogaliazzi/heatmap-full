<script setup>
import { ref } from "vue";
import { useUserStore } from "@/stores/user";
import fetchApi from "@/api";
import { useNotificationStore } from "@/stores/notification";

const { location } = defineProps(["location"]);
const { user } = useUserStore();
const { setNotification } = useNotificationStore();
const cto = defineModel();
const loading = ref(false);
const emit = defineEmits(["update:ctoList"]);

const payload = ref({
  name: "",
  lat: location.latitude,
  lng: location.longitude,
  cto_id: cto.value.id,
  user: user.name,
  cto_name: cto.value.name,
  date_time: new Date().toISOString(),
});

const valid = ref(false);
const formRef = ref(null);

const getPppoe = (name) => {
  return (
    name.split(" ")[0] +
    name.split(" ")[name.split(" ").length - 1] +
    "fibra".toLowerCase()
  );
};

const addClientReservados = async (body) => {
  try {
    await fetchApi.post("/reservados", body);
  } catch (error) {
    console.log(error);
  }
};

const addClient = async () => {
  const { valid } = await formRef.value.validate();

  if (valid) {
    payload.value.pppoe = getPppoe(payload.value.name);
    payload.value.name = `${payload.value.name.toUpperCase()} (RESERVADO)`;

    try {
      loading.value = true;
      const response = await fetchApi.post("client", payload.value);

      if (response.status === 201) {
        const { id } = response.data;

        await addClientReservados({
          tomodat_id: id,
          name: payload.value.name,
          coord: { lat: payload.value.lat, lng: payload.value.lng },
          cto_id: payload.value.cto_id,
          created_at: payload.value.date_time,
        });

        setNotification({
          msg: "Cliente reservado com sucesso",
          status: "success",
        });

        emit("update:ctoList");
      }
    } catch (error) {
      console.log(error);
      setNotification({
        msg: "Ocorreu um erro ao reservar o cliente",
        status: "error",
      });
    } finally {
      cto.value = null;
      loading.value = false;
    }
  }
};
</script>

<template>
  <v-card>
    <v-card-title>Nova Reserva</v-card-title>
    <v-card-subtitle>{{ cto.name }}</v-card-subtitle>
    <v-card-text>
      <v-form ref="formRef" v-model="valid" @submit.prevent="addClient">
        <v-text-field
          v-model.trim="payload.name"
          label="Nome"
          :rules="[(v) => !!v || 'Campo obrigatório']"
          required
        ></v-text-field>
        <v-text-field
          v-model="payload.lat"
          label="Latitude"
          required
          readonly
        ></v-text-field>
        <v-text-field
          v-model="payload.lng"
          label="Longitude"
          required
          readonly
        ></v-text-field>
        <v-btn color="primary" type="submit" :loading="loading"> Salvar </v-btn>
        <v-btn @click="cto = null"> Fechar </v-btn>
      </v-form>
    </v-card-text>
  </v-card>
</template>
