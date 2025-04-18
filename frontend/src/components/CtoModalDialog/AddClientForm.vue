<script setup>
import { defineProps, defineEmits, toRefs, ref, watch } from "vue";
import { useNotificationStore } from "@/stores/notification";
import { useUserStore } from "@/stores/user";
import formValidationRules from "./formValidationRules";
import fetchApi from "@/api";

const notification = useNotificationStore();
const userStore = useUserStore();

const props = defineProps(["clientPosition", "cto", "splitter"]);
const emit = defineEmits(["updateCtoClietns"]);

const { clientPosition, cto } = toRefs(props);

const name = ref("");
const pppoe = ref("");
const formRef = ref(null);
const loading = ref(false);

const { nameRules, pppoeRules, positionRules } = formValidationRules;

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
      name: name.value.toUpperCase(),
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
</script>

<template>
  <v-form ref="formRef" @submit.prevent="handleFormSubmit">
    <v-container>
      <v-row>
        <v-col cols="12">
          <v-text-field
            v-model="name"
            :rules="nameRules"
            label="Nome"
            type="text"
            required
          ></v-text-field>
        </v-col>
        <v-col cols="12">
          <v-text-field
            v-model="pppoe"
            :rules="pppoeRules"
            label="Pppoe"
            type="text"
            required
          >
          </v-text-field>
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
            >Adicionar</v-btn
          >
        </v-col>
      </v-row>
    </v-container>
  </v-form>
</template>
