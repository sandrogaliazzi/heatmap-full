<script setup>
import { ref, reactive } from "vue";
import fetchApi from "@/api";
import { useNotificationStore } from "@/stores/notification";

const { ramal } = defineProps(["ramal"]);
const emit = defineEmits(["ramal-saved"]);
const notification = useNotificationStore();
const handlingSubmit = ref(false);
const closeBtn = ref(null);

const ramalData = reactive({
  oltRamal: ramal?.oltRamal || "",
  oltIp: ramal?.oltIp || "",
  oltPon: ramal?.oltPon || "",
  ponVlan: ramal?.ponVlan || "",
  oltName: ramal?.oltName || "",
});

const inputRules = [
  (value) => {
    if (value) return true;

    return "Este campo é obrigatório";
  },
];

const form = ref(null);

const resetForm = () => {
  if (form.value) {
    form.value.reset();
    form.value.resetValidation();
  }
};

const saveRamal = async () => {
  const { valid } = await form.value.validate();
  if (!valid) {
    notification.setNotification({
      msg: "Erro, dados incompletos",
      status: "red",
    });
    return;
  }
  handlingSubmit.value = true;
  try {
    if (ramal && ramal._id) {
      await fetchApi.put(`/ramais`, {
        ...ramalData,
        _id: ramal._id,
      });
    } else {
      await fetchApi.post("/ramais", ramalData);
    }
    notification.setNotification({
      msg: "Ramal salvo com sucesso",
      status: "success",
    });

    emit("ramal-saved");
  } catch (error) {
    notification.setNotification({
      msg: "Erro ao salvar ramal",
      status: "error",
    });

    console.error("Error saving ramal:", error);
  } finally {
    handlingSubmit.value = false;
    closeBtn.value.$el.click();
    resetForm();
  }
};
</script>

<template>
  <v-dialog activator="parent" max-width="800">
    <template #default="{ isActive }">
      <v-card>
        <template #append>
          <v-btn
            icon="mdi-close"
            variant="text"
            ref="closeBtn"
            @click="isActive.value = false"
          ></v-btn>
        </template>
        <v-card-text>
          <v-form @submit.prevent="saveRamal" ref="form">
            <v-container>
              <v-row>
                <v-col cols="12" sm="6">
                  <v-text-field
                    label="Ramal OLT"
                    variant="underlined"
                    v-model="ramalData.oltRamal"
                    :rules="inputRules"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    label="IP OLT"
                    variant="underlined"
                    v-model="ramalData.oltIp"
                    :rules="inputRules"
                  ></v-text-field>
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="12" sm="6">
                  <v-text-field
                    label="PON OLT"
                    variant="underlined"
                    v-model="ramalData.oltPon"
                    :rules="inputRules"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    label="VLAN PON"
                    variant="underlined"
                    v-model="ramalData.ponVlan"
                    :rules="inputRules"
                  ></v-text-field>
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="12" sm="6">
                  <v-text-field
                    label="Nome OLT"
                    variant="underlined"
                    v-model="ramalData.oltName"
                    :rules="inputRules"
                  ></v-text-field>
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="12">
                  <v-btn
                    color="success"
                    block
                    type="submit"
                    :disabled="handlingSubmit"
                    >Salvar</v-btn
                  >
                </v-col>
              </v-row>
            </v-container>
          </v-form>
        </v-card-text>
      </v-card>
    </template>
  </v-dialog>
</template>
