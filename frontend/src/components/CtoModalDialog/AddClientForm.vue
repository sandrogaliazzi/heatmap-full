<script setup>
import { defineProps, defineEmits, toRefs, ref, watch } from "vue";
import { useNotificationStore } from "@/stores/notification";
import { useUserStore } from "@/stores/user";
import formValidationRules from "./formValidationRules";
import fetchApi from "@/api";
import SearchClient from "../Hubsoft/SearchClient.vue";
import SelectClientService from "../Hubsoft/SelectClientService.vue";

const notification = useNotificationStore();
const userStore = useUserStore();

const props = defineProps(["clientPosition", "cto", "splitter"]);
const emit = defineEmits(["updateCtoClietns", "updateServiceLocation"]);

const { clientPosition, cto } = toRefs(props);

const name = ref("");
const pppoe = ref("");
const formRef = ref(null);
const loading = ref(false);

const { nameRules, positionRules } = formValidationRules;

watch(name, (value) => {
  if (value) {
    const splitedName = value.split(" ");

    const firstName = splitedName[0];

    const lastName = splitedName.pop();

    const pppoeMounted = `${firstName}${lastName}fibra`.toLowerCase();

    pppoe.value = pppoeMounted;
  }
});

const showNotification = () => {
  notification.setNotification({
    msg: "Cliente cadastrado com sucesso",
    status: "success",
  });
};

const normalizeName = (name) => {
  name.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return `${name} ${selectedService.value.id_cliente_servico}`;
};

const toggleLoading = () => (loading.value = !loading.value);

const resetForm = () => formRef.value.reset();

const updateCtoClietns = () => emit("updateCtoClietns");

const sendNewClient = async (bodyRequest) => {
  try {
    const response = await fetchApi.post("client", bodyRequest);

    return response.data;
  } catch (err) {
    notification.setNotification({
      msg: err.msg,
      status: "red",
    });
  }
};

const execFnList = (fnList) => fnList.forEach((fn) => fn());

const handleAfterSubmitTasks = () => {
  return execFnList([
    showNotification,
    toggleLoading,
    resetForm,
    updateCtoClietns,
  ]);
};

const handleFormSubmit = async () => {
  const { valid } = await formRef.value.validate();

  const { id, name: cto_name } = cto.value;
  const { lat, lng } = clientPosition.value;

  if (valid) {
    loading.value = true;

    const bodyRequest = {
      name: isBindedToHubsoft.value
        ? normalizeName(selectedClient.value.nome_razaosocial)
        : name.value.toUpperCase(),
      pppoe: pppoe.value,
      lat: lat.toString(),
      lng: lng.toString(),
      cto_id: id,
      user: userStore.user.name,
      cto_name,
      date_time: new Date().toLocaleString("pt-BR"),
    };

    await sendNewClient(bodyRequest);

    handleAfterSubmitTasks();
  }
};

const isBindedToHubsoft = ref(false);
const selectedClient = ref(null);
const selectedService = ref(null);

const handleServiceSelection = (service) => {
  selectedService.value = service;
  clientPosition.value.lat = service.endereco_instalacao.coordenadas?.latitude;
  clientPosition.value.lng = service.endereco_instalacao.coordenadas?.longitude;
  emit("updateServiceLocation", {
    latitude: service.endereco_instalacao.coordenadas?.latitude,
    longitude: service.endereco_instalacao.coordenadas?.longitude,
  });
  pppoe.value = service.login ? service.login : "pppoeclientefibra";
};
</script>

<template>
  <v-form ref="formRef" @submit.prevent="handleFormSubmit">
    <v-container>
      <v-switch
        label="vincular cliente hubsoft"
        color="primary"
        v-model="isBindedToHubsoft"
      ></v-switch>
      <v-row>
        <v-col cols="12">
          <v-text-field
            v-model="name"
            v-if="!isBindedToHubsoft"
            :rules="nameRules"
            label="Nome"
            type="text"
            required
          ></v-text-field>
        </v-col>
        <v-col cols="12" v-if="isBindedToHubsoft">
          <search-client @client-selected="selectedClient = $event" />
        </v-col>
        <v-col cols="12" v-if="selectedClient && isBindedToHubsoft">
          <select-client-service
            v-model="selectedClient"
            @service-selected="handleServiceSelection"
          />
        </v-col>
        <v-col cols="6">
          <v-text-field
            v-model="clientPosition.lat"
            label="Latitude"
            type="text"
            :rules="positionRules"
            required
            readonly
          >
          </v-text-field>
        </v-col>
        <v-col cols="6">
          <v-text-field
            v-model="clientPosition.lng"
            label="Longitude"
            type="text"
            :rules="positionRules"
            required
            readonly
          >
          </v-text-field>
        </v-col>

        <v-col cols="12" align-self="end">
          <v-btn
            type="submit"
            block
            :disabled="loading"
            :loading="loading"
            append-icon="mdi-plus-circle"
            color="success"
            >Adicionar tomodat</v-btn
          >
        </v-col>
      </v-row>
    </v-container>
  </v-form>
</template>
