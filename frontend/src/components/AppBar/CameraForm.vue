<script setup>
import { ref, watch, inject, onMounted } from "vue";
import fetchApi from "@/api";
import { useNotificationStore } from "@/stores/notification";
import axios from "axios";

const { camera } = defineProps(["camera"]);

const clientCameraName = ref("");
const serialNumber = ref("");
const cameraId = ref(null);
const files = ref([]);
const selectedImages = ref([]);
const checkSelectedFiles = ref(false);
const formRef = ref(null);
const cardLoader = ref(false);
const notification = useNotificationStore();
const closeDialog = inject("closeDialog");

const inputRules = [
  (value) => {
    if (value) return true;

    return "Este campo é obrigatório";
  },
];

const fileInputRules = [
  (value) => {
    if (value.length == 2) return true;

    return "Selecione no mínimo duas fotos";
  },
];

watch(files, () => {
  if (files.value.length == 2) {
    selectedImages.value = files.value.map((file) => URL.createObjectURL(file));
  } else {
    selectedImages.value = [];
  }
});

const resetForm = () => {
  clientCameraName.value = "";
  serialNumber.value = "";
  files.value = [];
  cardLoader.value = false;
};

const handleSubmit = async () => {
  const { valid } = await formRef.value.validate();

  if (valid) {
    const form = document.getElementById("cameraForm");
    const formData = new FormData(form);

    try {
      cardLoader.value = true;
      const response = await fetchApi.post("uploadimg", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Accept: "*/*",
        },
      });

      if (response.status == 200) {
        notification.setNotification({
          msg: "Camera adicionada com sucesso",
          status: "success",
        });
        resetForm();
      }
    } catch (error) {
      notification.setNotification({
        msg: "erro ao adicionar camera",
        status: "error",
      });
    }
  }
};

onMounted(() => {
  if (camera) {
    clientCameraName.value = camera.clientCameraName;
    serialNumber.value = camera.serialNumber;
    cameraId.value = camera._id;
  }
});
</script>

<template>
  <v-card :loading="cardLoader">
    <template v-slot:loader="{ isActive }">
      <v-progress-linear
        :active="isActive"
        color="orange"
        height="4"
        indeterminate
      ></v-progress-linear>
    </template>
    <v-card-title class="bg-orange">
      <div class="d-flex justify-space-between align-center">
        <div class="d-flex">
          <p class="me-2">Adicionar Câmera</p>
          <v-icon>mdi-cctv</v-icon>
        </div>
        <v-btn variant="text" icon="mdi-close" @click="closeDialog"></v-btn>
      </div>
    </v-card-title>
    <v-card-text>
      <v-form
        @submit.prevent="handleSubmit"
        ref="formRef"
        class="mb-3"
        id="cameraForm"
      >
        <v-text-field v-model="cameraId" name="id" v-show="false">
        </v-text-field>
        <v-text-field
          v-model="clientCameraName"
          name="clientCameraName"
          :rules="inputRules"
          class="mb-2"
          clearable
          label="Cliente"
        ></v-text-field>

        <v-text-field
          v-model="serialNumber"
          name="serialNumber"
          :rules="inputRules"
          clearable
          type="text"
          label="Número serial"
          placeholder="serial"
        ></v-text-field>

        <v-file-input
          chips
          multiple
          :rules="fileInputRules"
          accept="image/*"
          name="image"
          label="Selecionar Fotos"
          v-model="files"
        ></v-file-input>

        <br />

        <v-btn
          block
          color="success"
          size="large"
          type="submit"
          variant="elevated"
          @keyup.enter="handleSubmit"
          :disabled="!checkSelectedFiles || cardLoader"
        >
          Enviar
        </v-btn>
      </v-form>
      <v-divider></v-divider>
      <div v-if="selectedImages.length > 0">
        <v-checkbox
          label="Confirmar Imagens"
          color="orange"
          v-model="checkSelectedFiles"
        ></v-checkbox>
        <v-carousel hide-delimiters style="height: 200px">
          <v-carousel-item
            v-for="(image, index) in selectedImages"
            :key="index"
            :src="image"
          ></v-carousel-item>
        </v-carousel>
      </div>
      <div
        v-else
        class="d-flex justify-center align-center"
        style="height: 200px"
      >
        <v-icon size="100">mdi-image-area</v-icon>
      </div>
    </v-card-text>
  </v-card>
</template>
