<script setup>
import { ref, onMounted, computed } from "vue";
import personIcon from "@/assets/personIcon.png";
import fetchApi from "@/api";
import { useNotificationStore } from "@/stores/notification";
import { useWindowSize } from "vue-window-size";

const { clientLocation } = defineProps(["clientLocation"]);
const emit = defineEmits(["update:clientLocation", "delete:clientLocation"]);
const notification = useNotificationStore();

const markerAnimation = ref(1);
const position = ref({ lat: clientLocation.lat, lng: clientLocation.lng });

const { width } = useWindowSize();

const mapHeight = computed(() => {
  if (width.value < 600) {
    return "16rem";
  }
  return "36rem";
});

const mapStyle = {
  width: "100%",
  height: mapHeight.value,
  borderRadius: "20px",
};

const openNewGMapTab = (app) => {
  let url = "";
  if (app === "waze") {
    url = `https://www.waze.com/ul?ll=${position.value.lat}%2C${position.value.lng}&navigate=yes&zoom=17`;
  } else {
    url = `https://www.google.com/maps/search/?api=1&query=${position.value.lat},${position.value.lng}`;
  }
  const win = window.open(url, "_blank");
  win.focus();
};

const onClientLocationRemoved = async (id) => {
  if (confirm("deseja remover a localizacao deste cliente?")) {
    try {
      const response = await fetchApi.delete(`/deletectoclient/${id}`);
      if (response.status === 201) {
        notification.setNotification({
          status: "success",
          msg: "Localizacao removida com sucesso",
        });

        emit("delete:clientLocation");
      }
    } catch (error) {
      console.error(error);
      notification.setNotification({
        status: "error",
        msg: "Erro ao remover localizacao",
      });
    }
  }
};

const onClientLocationUpdated = async (id, p) => {
  try {
    const response = await fetchApi.post("/updatectoclient", {
      _id: id,
      data: {
        lat: p.lat,
        lng: p.lng,
      },
    });

    if (response.status === 200) {
      notification.setNotification({
        status: "success",
        msg: "Localizacao atualizada com sucesso",
      });

      position.value = {
        lat: p.lat,
        lng: p.lng,
      };

      emit("update:clientLocation");
    }
  } catch (error) {
    console.error(error);
    notification.setNotification({
      status: "error",
      msg: "Ocorreu um erro ao atualizar a localizacao",
    });
  }
};

onMounted(() => {
  setTimeout(() => {
    markerAnimation.value = 2;
  }, 3000);
});
</script>

<template>
  <v-card variant="flat">
    <v-card-subtitle>
      <v-banner class="my-4" color="warning" icon="mdi-information">
        <v-banner-text class="text-wrap">
          Para editar a localização do cliente, arraste o marcador.
        </v-banner-text>
      </v-banner>
    </v-card-subtitle>
    <v-card-text>
      <GMapMap
        :center="{
          lat: parseFloat(clientLocation.lat),
          lng: parseFloat(clientLocation.lng),
        }"
        :zoom="18"
        ref="mapRef"
        map-type-id="satellite"
        :style="mapStyle"
      >
        <GMapMarker
          :position="{
            lat: parseFloat(clientLocation.lat),
            lng: parseFloat(clientLocation.lng),
          }"
          :icon="personIcon"
          :animation="markerAnimation"
          :draggable="true"
          @dragend="
            onClientLocationUpdated(clientLocation._id, $event.latLng.toJSON())
          "
        />
      </GMapMap>
    </v-card-text>

    <div class="px-3 mb-4">
      <div class="d-flex flex-column flex-md-row ga-2 w-100">
        <v-btn
          color="primary"
          variant="tonal"
          class="flex-grow-1"
          prepend-icon="mdi-google-maps"
          @click="openNewGMapTab('maps')"
          >Abrir no maps</v-btn
        >
        <v-btn
          color="primary"
          variant="tonal"
          class="flex-grow-1"
          prepend-icon="mdi-waze"
          @click="openNewGMapTab('waze')"
          >Abrir no waze</v-btn
        >
      </div>
      <v-btn
        color="red"
        variant="tonal"
        prepend-icon="mdi-delete"
        @click="onClientLocationRemoved(clientLocation._id)"
        block
        class="mt-3"
        >Excluir Localização</v-btn
      >
    </div>
  </v-card>
</template>
