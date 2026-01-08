<script setup>
import { onMounted } from "vue";
import { useOsStore } from "@/stores/osStore";
import flag0 from "@/assets/flags/flag-variant-custom-0.png";
import flag1 from "@/assets/flags/flag-variant-custom-1.png";
import flag2 from "@/assets/flags/flag-variant-custom-2.png";
import flag3 from "@/assets/flags/flag-variant-custom-3.png";
import flag4 from "@/assets/flags/flag-variant-custom-4.png";
import flag5 from "@/assets/flags/flag-variant-custom-5.png";
import flag6 from "@/assets/flags/flag-variant-custom-6.png";
import flag7 from "@/assets/flags/flag-variant-custom-7.png";
import flag8 from "@/assets/flags/flag-variant-custom-8.png";
import flag9 from "@/assets/flags/flag-variant-custom-9.png";
import flag10 from "@/assets/flags/flag-variant-custom-10.png";
import flag11 from "@/assets/flags/flag-variant-custom-11.png";
import flag12 from "@/assets/flags/flag-variant-custom-12.png";
import flag13 from "@/assets/flags/flag-variant-custom-13.png";
import flag14 from "@/assets/flags/flag-variant-custom-14.png";
import flag15 from "@/assets/flags/flag-variant-custom-15.png";
import flag16 from "@/assets/flags/flag-variant-custom-16.png";
import flag17 from "@/assets/flags/flag-variant-custom-17.png";
import flag18 from "@/assets/flags/flag-variant-custom-18.png";
import flag19 from "@/assets/flags/flag-variant-custom-19.png";
import flag20 from "@/assets/flags/flag-variant-custom-20.png";
import flag21 from "@/assets/flags/flag-variant-custom-21.png";
import flag22 from "@/assets/flags/flag-variant-custom-22.png";
import flag23 from "@/assets/flags/flag-variant-custom-23.png";
import flag24 from "@/assets/flags/flag-variant-custom-24.png";
import flag25 from "@/assets/flags/flag-variant-custom-25.png";
import flag26 from "@/assets/flags/flag-variant-custom-26.png";
import flag27 from "@/assets/flags/flag-variant-custom-27.png";
import flag28 from "@/assets/flags/flag-variant-custom-28.png";
import flag29 from "@/assets/flags/flag-variant-custom-29.png";
import flag30 from "@/assets/flags/flag-variant-custom-30.png";
import flag31 from "@/assets/flags/flag-variant-custom-31.png";

const emit = defineEmits(["open-os-modal"]);

const flagIcons = [
  flag0,
  flag1,
  flag2,
  flag3,
  flag4,
  flag5,
  flag6,
  flag7,
  flag8,
  flag9,
  flag10,
  flag11,
  flag12,
  flag13,
  flag14,
  flag15,
  flag16,
  flag17,
  flag18,
  flag19,
  flag20,
  flag21,
  flag22,
  flag23,
  flag24,
  flag25,
  flag26,
  flag27,
  flag28,
  flag29,
  flag30,
  flag31,
];

const osStore = useOsStore();

const getFlag = (tecnico) => {
  return Object.keys(osStore.cores).indexOf(tecnico);
};

onMounted(async () => {
  await osStore.getTodayOsList();
});
</script>
<template>
  <template v-for="(list, index) in osStore.osList" :key="index">
    <GMapMarker
      v-for="os in list.os"
      :key="os.id_ordem_servico"
      :position="{
        lat: parseFloat(os.dados_endereco_instalacao?.coordenadas.latitude),
        lng: parseFloat(os.dados_endereco_instalacao?.coordenadas.longitude),
      }"
      :icon="{
        url: flagIcons[getFlag(list.tecnico)],
        color: 'blue',
        scaledSize: { width: 32, height: 32 },
      }"
      :visible="osStore.visibleOs[list.tecnico]"
      :clickable="true"
      @click="emit('open-os-modal', os)"
    ></GMapMarker>
  </template>
</template>
