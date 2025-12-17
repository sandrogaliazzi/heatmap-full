<script setup>
import { inject, ref, onMounted, computed } from "vue";
import fetchApi from "@/api";

const emit = defineEmits(["update:forceRender"]);
defineProps(["hubsoftData"]);

import OnuList from "./UnAuthOnuList";
import RegisterOnuForm from "./RegisterOnuForm";
import AfterOnuSubmit from "./AfterOnuSubmit";

const loadingApi = ref(true);
const oltRamals = ref([]);
const unauthorizedOnuList = ref([]);
const windowNumer = ref(1);
const selectedOnu = ref(null);
const authorizedOnu = ref(null);
const findMac = ref("");

const heatmapOlts = ref([]);

const getOltList = async () => {
  try {
    const response = await fetchApi.get("listar-olt");
    return response.data.filter((olt) => olt.active);
  } catch (error) {
    console.log("erro ao buscar equipamentos", error.message);
  }
};

const getOltRamals = async () => {
  try {
    const response = await fetchApi("ramais");

    return response.data;
  } catch (error) {
    console.log("erro ao consultar ramais", error.message);
    loadingApi.value = false;
  }
};

const getUnauthorizedOnuInfo = async () => {
  try {
    const promiseList = heatmapOlts.value.map(async (olt) => {
      if (olt.oltName.includes("FIBERHOME")) {
        const onus = await getUnauthorizedOnuInfoFromFiberhome();
        return [...onus, olt.oltIp];
      }
      const response = await fetchApi.post("listar-onu", { oltIp: olt.oltIp });

      return [...response.data, olt.oltIp];
    });

    const results = await Promise.allSettled(promiseList);

    const filterResults = results
      .filter((result) => result.status === "fulfilled")
      .map((result) => result.value);

    return filterResults.reduce((onuList, data) => {
      if (data.length > 1) {
        const oltIp = data.pop();
        data.forEach((onu) => onuList.push({ ...onu, oltIp }));
      }

      return onuList;
    }, []);
  } catch (error) {
    console.log("erro ao consultar olts", error.message);
    loadingApi.value = false;
  }
};

const getUnauthorizedOnuInfoFromFiberhome = async () => {
  try {
    const response = await fetchApi.get("/descobrir-onu-fiberhome");

    return response.data.onus;
  } catch (error) {
    console.log("erro ao consultar olts fiberhome", error.message);
    loadingApi.value = false;
  }
};

const mergeOnuAndRamalData = async () => {
  const unauthorizedOnuInfo = await getUnauthorizedOnuInfo();

  return unauthorizedOnuInfo.map((onuData) => {
    const matchingData = oltRamals.value.find(
      (ramalData) =>
        ramalData.oltIp == onuData.oltIp && ramalData.oltPon == onuData.gpon
    );
    return matchingData ? { ...onuData, ...matchingData } : onuData;
  });
};

const hasUnauthorizedOnu = computed(() => {
  return unauthorizedOnuList.value.length;
});

const unAuthOnuFilterByMAC = computed(() => {
  return unauthorizedOnuList.value.filter((onu) => {
    return onu.onuMac.includes(findMac.value.toLowerCase());
  });
});

const fetchAll = async () => {
  heatmapOlts.value = await getOltList();
  oltRamals.value = await getOltRamals();
  unauthorizedOnuList.value = await mergeOnuAndRamalData();
  loadingApi.value = false;
};

onMounted(async () => {
  await fetchAll();
});

const key = ref(0);

const resgisterOnu = (onu) => {
  windowNumer.value++;
  selectedOnu.value = onu;
  key.value++;
};

const showOnuRegisterStatus = (data) => {
  authorizedOnu.value = data;
  windowNumer.value = 3;
};

const closeDialog = inject("closeDialog");
</script>

<template>
  <v-card :loading="loadingApi" style="min-height: 600px">
    <v-card-title class="bg-orange">
      <div class="d-flex justify-space-between align-center">
        <div class="d-flex">
          <p class="me-2">Liberar ONU</p>
          <v-icon>mdi-set-top-box</v-icon>
        </div>
        <div>
          <v-btn
            v-if="windowNumer > 1 && windowNumer !== 3"
            @click="windowNumer--"
            icon="mdi-arrow-left"
            variant="text"
          ></v-btn>
          <v-btn
            variant="text"
            icon="mdi-reload"
            @click="emit('update:forceRender')"
          ></v-btn>
          <v-btn variant="text" icon="mdi-close" @click="closeDialog"></v-btn>
        </div>
      </div>
    </v-card-title>
    <v-card-text>
      <v-window v-model="windowNumer">
        <v-window-item :value="1">
          <v-text-field
            type="search"
            label="Pesquisar MAC"
            v-model="findMac"
          ></v-text-field>
          <OnuList
            v-if="hasUnauthorizedOnu"
            :onuList="unAuthOnuFilterByMAC || unauthorizedOnuList"
            @update:window-number="resgisterOnu"
          />
          <v-container v-else>
            <div style="height: 300" class="d-flex justify-center align-center">
              <v-icon size="150">mdi-alert-circle</v-icon>
            </div>
            <p class="subtitle text-center text-warning">
              Não há ONUs para Liberar
            </p>
          </v-container>
        </v-window-item>
        <v-window-item :value="2">
          <RegisterOnuForm
            :form-data="selectedOnu"
            :hubsoft-data="hubsoftData"
            :key="key"
            @update:onu-register-with-success="showOnuRegisterStatus"
          />
        </v-window-item>
        <v-window-item :value="3">
          <AfterOnuSubmit
            :authorizedOnu="authorizedOnu"
            @update:refresh-list="emit('update:forceRender')"
          />
        </v-window-item>
      </v-window>
    </v-card-text>
  </v-card>
</template>
