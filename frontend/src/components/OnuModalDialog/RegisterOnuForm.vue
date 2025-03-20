<script setup>
import { ref } from "vue";
import { useUserStore } from "@/stores/user";
import fetchApi from "@/api";

const { formData } = defineProps(["formData"]);
const emit = defineEmits([
  "update:windowNumber",
  "update:onuRegisterWithSuccess",
]);

const formRef = ref(null);
const onuAlias = ref("");
const cto = ref("");
const tecnico = ref("");
const userStore = useUserStore();
const loadingSubmit = ref(false);
const isDisabledVlanInput = ref(true);

const inputRules = [
  (value) => {
    if (value) return true;

    return "Este campo é obrigatório";
  },
];

const toParksTextFormat = (text) => text.replace(/\s+/g, "-").toUpperCase();

const handleSubmit = async () => {
  const { valid } = await formRef.value.validate();

  if (valid) {
    loadingSubmit.value = true;

    const requestBody = {
      oltIp: formData.oltIp,
      oltPon: formData.oltPon,
      onuVlan: formData.ponVlan,
      cto: toParksTextFormat(cto.value),
      tecnico: toParksTextFormat(tecnico.value),
      onuSerial: formData.onuMac,
      user: userStore.user.name || "Usuário desconhecido",
      onuMac: formData.onuMac,
      gpon: formData.gpon,
      onuModel: formData.onuModel,
      oltRamal: formData.oltRamal,
      onuAlias: toParksTextFormat(onuAlias.value),
      sinalTX: formData["Power Level"],
      sinalRX: formData["RSSI"],
    };

    console.log(requestBody);

    try {
      const response = await fetchApi.post("liberar-onu", requestBody);
      if (response.status === 200) {
        loadingSubmit.value = false;

        emit("update:onuRegisterWithSuccess", {
          ...requestBody,
          signal: {
            tx: formData["Power Level"],
            rx: formData["RSSI"],
          },
        });
      }
    } catch (error) {
      console.log("erro ao adicionar onu", error.message);
    }
  }
};
</script>

<template>
  <v-form @submit.prevent="handleSubmit" ref="formRef">
    <v-row>
      <v-col cols="6">
        <v-text-field
          :label="formData.onuMac.toUpperCase()"
          disabled
        ></v-text-field>
      </v-col>
      <v-col cols="6">
        <v-text-field
          :label="`${formData['Power Level']} ${formData['RSSI']}`"
          disabled
        ></v-text-field>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="6">
        <v-text-field
          v-model="cto"
          :rules="inputRules"
          clearable
          label="CTO"
          prepend-inner-icon="mdi-cube"
          placeholder="Digite o nome da cto"
        ></v-text-field>
      </v-col>
      <v-col cols="6">
        <v-text-field
          v-model="formData.ponVlan"
          label="VLAN"
          prepend-inner-icon="mdi-web"
          append-inner-icon="mdi-pencil"
          @click:append-inner="isDisabledVlanInput = !isDisabledVlanInput"
          :readonly="isDisabledVlanInput"
        >
        </v-text-field>
      </v-col>
    </v-row>

    <v-text-field
      v-model="onuAlias"
      :rules="inputRules"
      clearable
      label="CLIENTE"
      prepend-inner-icon="mdi-account"
      placeholder="Digite o nome da cliente"
    ></v-text-field>

    <v-text-field
      v-model="tecnico"
      :rules="inputRules"
      clearable
      label="Tecnico"
      prepend-inner-icon="mdi-tools"
      placeholder="Digite o nome da Técnico"
    ></v-text-field>

    <br />

    <v-btn
      block
      color="success"
      size="large"
      type="submit"
      variant="elevated"
      :disabled="loadingSubmit"
      :loading="loadingSubmit"
      @keyup.enter="handleSubmit"
    >
      LIBERAR ONU
    </v-btn>
  </v-form>
</template>
