<script setup>
import { ref } from "vue";
import fetchApi from "@/api";

const { onuList } = defineProps(["onuList"]);
const emit = defineEmits(["update:windowNumber"]);

const onuSignalDataList = ref({});
const isLoadingSignal = ref(false);

const checkOnuSignal = async (onu) => {
  const { oltIp, onuMac } = onu;

  try {
    isLoadingSignal.value = true;

    const signal = await fetchApi.post("verificar-onu-completo", {
      oltIp: oltIp,
      onuAlias: onuMac,
    });

    onuSignalDataList.value[onuMac] = signal.data;

    isLoadingSignal.value = false;
  } catch (error) {
    console.log("erro ao consultar sinal", error.message);
  }
};

const registerOnu = async (onu) => {
  await checkOnuSignal(onu);

  const selectedOnuDataWithSignal = {
    ...onu,
    ...onuSignalDataList.value[onu.onuMac],
  };

  emit("update:windowNumber", selectedOnuDataWithSignal);
};
</script>

<template>
  <v-list lines="three">
    <v-list-subheader>ONUs NÃO AUTORIZADAS</v-list-subheader>
    <v-list-group v-for="onu in onuList" :key="onu.onuMac">
      <template #activator="{ props }">
        <v-list-item
          v-bind="props"
          :title="`${onu.onuMac.toUpperCase()} ${onu.oltName}`"
          :value="onu.onuMac"
          prepend-icon="mdi-circle-box"
        >
          <v-list-item-subtitle
            class="mt-2 d-flex flex-column flex-md-row ga-2"
          >
            <v-chip class="mr-2 d-none d-md-block">{{ onu.onuModel }}</v-chip>
            <v-chip>{{ onu.oltRamal }}</v-chip>
            <v-chip
              v-if="onuSignalDataList[onu.onuMac]"
              size="small"
              color="primary"
              class="mt-2"
              >TX: {{ onuSignalDataList[onu.onuMac]["Power Level"] }} RX:
              {{ onuSignalDataList[onu.onuMac]["RSSI"] }}</v-chip
            >
          </v-list-item-subtitle>
        </v-list-item>
      </template>
      <v-list-item>
        <template #append>
          <div class="d-flex flex-column flex-md-row ga-2">
            <v-btn
              color="success"
              variant="tonal"
              class="mr-2"
              @click="registerOnu(onu)"
              >Liberar</v-btn
            >
            <v-btn
              color="warning"
              variant="tonal"
              @click="checkOnuSignal(onu)"
              :loading="isLoadingSignal"
              >Verificar Sinal</v-btn
            >
          </div>
        </template>
      </v-list-item>
    </v-list-group>
  </v-list>
</template>
