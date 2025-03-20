<script setup>
import { ref } from "vue";
import e from "@/assets/flag-variant-custom.png";
import e2 from "@/assets/flag-variant-off-custom.png";

const markerId = ref(null);

const getPosition = (adress) => {
  return adress.geometry.location;
};

const { adressList } = defineProps(["adressList"]);
</script>
<template v-if="adressList.length > 0">
  <GMapMarker
    v-for="(ad, index) in adressList"
    :key="ad.adress.place_id"
    :icon="ad.encerrado == 'N' ? e : e2"
    :position="getPosition(ad.adress)"
    @click="markerId = index"
  >
    <GMapInfoWindow
      :closeclick="true"
      @closeclick="markerId = null"
      :opened="markerId === index"
    >
      <div>
        <span
          class="text-grey-darken-4 font-weight-bold text-center"
          style="font-size: 14px"
          >{{ ad.cliente }}</span
        >
        <div class="my-3"></div>
        <span class="text-grey-darken-4 text-center" style="font-size: 12px">{{
          ad.descricao
        }}</span>
        <div class="my-3"></div>
        <div v-if="ad.encerramento">
          <p
            class="text-grey-darken-4 font-weight-bold"
            style="font-size: 14px"
          >
            Encerramento:
          </p>
          <span
            class="text-grey-darken-4 text-center"
            style="font-size: 12px"
            >{{ ad.encerramento }}</span
          >
        </div>
      </div>
    </GMapInfoWindow>
  </GMapMarker>
</template>
