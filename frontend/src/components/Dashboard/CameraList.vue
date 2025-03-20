<script setup>
import fetchApi from "@/api";
import DialogBox from "../Dialog/Dialog.vue";
import CameraForm from "../AppBar/CameraForm.vue";
import { ref, onMounted, computed } from "vue";

const cameras = ref([]);
const camera = ref({});
const urlImgList = ref([]);

const query = ref("");
const dialog = ref(false);
const cameraDialog = ref(false);
const loading = ref(true);

const onCloseDialog = (value) => (dialog.value = value);

const fetchCameras = async () => {
  const response = await fetchApi("getallcameras");

  loading.value = false;

  cameras.value = response.data;
};

onMounted(async () => {
  fetchCameras();
});

const filteredResults = computed(() => {
  return cameras.value.filter((camera) =>
    camera.clientCameraName.toUpperCase().includes(query.value.toUpperCase())
  );
});

const getCameraImgPath = async (cameraData) => {
  const paths = Object.keys(cameraData).filter((key) =>
    key.startsWith("filePath")
  );

  const promiseList = paths.map(async (path) => {
    const filePath = {
      filePath: cameraData[path],
    };
    return fetch(`https://api.heatmap.conectnet.net/getcameraimg`, {
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify(filePath),
    });
  });

  const imgReadStreamList = await Promise.all(promiseList);

  const urls = await readImgFiles(imgReadStreamList);

  urlImgList.value = await Promise.all(urls);

  dialog.value = true;
};

const readImgFiles = async (files) => {
  return files.map(async (filePromise) => {
    const blob = await filePromise.blob();

    const imageUrl = URL.createObjectURL(blob);

    return imageUrl;
  });
};

const cameraEdit = (selectedCamera) => {
  camera.value = selectedCamera;
  cameraDialog.value = true;
};
</script>

<template>
  <v-row justify="center">
    <DialogBox :isOpen="dialog" @update:modal-value="onCloseDialog">
      <v-card elevation="10">
        <v-toolbar color="orange">
          <v-icon class="ml-4">mdi-qrcode</v-icon>
          <v-toolbar-title> QR CODE </v-toolbar-title>

          <v-spacer></v-spacer>

          <v-btn
            variant="text"
            icon="mdi-close"
            class="ms-2"
            @click="dialog = false"
          ></v-btn>
        </v-toolbar>

        <v-card-text>
          <v-carousel hide-delimiters>
            <v-carousel-item
              v-for="(item, i) in urlImgList"
              :key="i"
              :src="item"
              cover
            ></v-carousel-item>
          </v-carousel>
        </v-card-text>
      </v-card>
    </DialogBox>
    <DialogBox
      :is-open="cameraDialog"
      @update:modal-value="cameraDialog = false"
    >
      <CameraForm :camera="camera" />
    </DialogBox>
    <v-col cols="12" md="10" class="fixed-column">
      <v-form>
        <v-text-field
          variant="solo"
          label="Pesquisar"
          append-inner-icon="mdi-magnify"
          single-line
          hide-details
          v-model="query"
          :loading="loading"
        >
        </v-text-field>
      </v-form>
    </v-col>
    <v-col cols="12" md="10" class="scrollable-column">
      <v-list nav lines="three">
        <div v-if="loading">
          <v-list-item>
            <div
              class="d-flex justify-center align-center text-center"
              style="min-height: 500px"
            >
              <div>
                <v-progress-circular
                  indeterminate
                  :size="128"
                  :width="8"
                  color="orange"
                ></v-progress-circular>
              </div>
            </div>
          </v-list-item>
        </div>
        <div v-if="query && !filteredResults.length">
          <v-list-item>
            <div
              class="d-flex justify-center align-center text-center"
              style="min-height: 500px"
            >
              <div>
                <v-icon size="200px"> mdi-camera-off </v-icon>
                <p class="text-center text-h5">
                  Nenhum resultado correspondente a {{ query }}
                </p>
              </div>
            </div>
          </v-list-item>
        </div>
        <div v-else>
          <v-list-item
            v-for="camera in filteredResults || cameras"
            :title="camera.clientCameraName.toUpperCase()"
            :value="camera.serialNumber"
          >
            <template #prepend>
              <v-btn
                icon="mdi-camera-account"
                variant="text"
                class="mr-2"
                @click="getCameraImgPath(camera)"
              ></v-btn>
            </template>
            <v-list-item-subtitle class="mt-2">
              <p>Camera registrada em: {{ camera.registerDate }}</p>
              <p class="d-block d-sm-none font-weight-bold">
                {{ camera.serialNumber }}
              </p>
            </v-list-item-subtitle>
            <template #append>
              <div class="d-none d-sm-flex align-center">
                <v-chip color="primary">
                  {{ camera.serialNumber }}
                </v-chip>
                <v-btn
                  icon="mdi-qrcode-scan"
                  variant="tonal"
                  color="success"
                  class="ma-2"
                  @click="getCameraImgPath(camera)"
                ></v-btn>
                <v-btn
                  icon="mdi-qrcode-edit"
                  variant="tonal"
                  color="orange"
                  class="ma-2"
                  @click="cameraEdit(camera)"
                >
                </v-btn>
              </div>
            </template>
          </v-list-item>
        </div>
      </v-list>
    </v-col>
  </v-row>
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
