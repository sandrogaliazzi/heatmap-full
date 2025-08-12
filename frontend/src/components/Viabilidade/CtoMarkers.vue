<script setup>
import { ref } from "vue";
import ctoIcon from "@/assets/ctoconect.png";

defineProps(["ctoList"]);
const openId = ref(null);
</script>

<template>
  <GMapMarker
    v-for="cto in ctoList"
    :key="cto.id"
    :position="{
      lat: Number.parseFloat(cto.dot.lat),
      lng: Number.parseFloat(cto.dot.lng),
    }"
    :title="cto.name"
    :icon="ctoIcon"
    @click="openId = cto.id"
  >
    <GMapInfoWindow
      :closeclick="true"
      :opened="openId === cto.id"
      @closeclick="openId = null"
    >
      <div class="text-black d-flex flex-column justify-center align-center">
        <strong>
          {{ cto.name }}
        </strong>
        <v-btn color="primary" variant="plain" class="mt-2">reservar</v-btn>
        <v-btn color="error" variant="plain" @click="openId = null"
          >fechar</v-btn
        >
      </div>
    </GMapInfoWindow>
  </GMapMarker>
</template>
