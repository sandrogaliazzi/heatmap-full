<script setup>
import { inject, ref, onMounted, computed, watch } from "vue";
import OnuList from "./OnuList.vue";
import fetchApi from "@/api";

const { clients, city } = defineProps(["clients", "city"]);
const emit = defineEmits(["exit"]);

const onuList = ref([]);
const onuListCopy = ref([]);
const vLanList = ref([]);
const selectedVlan = ref(null);
const closeDialog = inject("closeDialog");
const query = ref("");
const heatmapOlts = ref([]);
const renderLimit = ref(100);

const getOltList = async () => {
  try {
    const response = await fetchApi.get("listar-olt");
    heatmapOlts.value = response.data.filter((olt) => olt.active);
  } catch (error) {
    console.log("erro ao buscar equipamentos", error.message);
  }
};

const citysFilter = {
  "NOVA HARTZ": ["NOVA HARTZ"],
  ARARICA: ["ARARICA"],
  IGREJINHA: ["IGREJINHA", "NOVA HARTZ"],
  SAPIRANGA: ["ARARICA"],
  "TRES COROAS": ["IGREJINHA"],
  "M. PEDRA": ["MORRO DA PEDRA", "FAZENDA FIALHO", "ARARICA"],
  "FAZ. FIALHO": ["FAZENDA FIALHO", "MORRO DA PEDRA"],
  PAROBE: ["PAROBÉ", "IGREJINHA", "NOVA HARTZ"],
  "SÃO JOÃO DO DESERTO": ["SÃO JOÃO DO DESERTO", "MORUNGAVA", "FAZENDA FIALHO"],
  MORUNGAVA: ["MORUNGAVA", "SÃO JOÃO DO DESERTO"],
};

const filterOltsByCity = (city) => {
  const olts = heatmapOlts.value.filter((olt) =>
    citysFilter[city].includes(olt.oltPop),
  );
  return !olts.length ? heatmapOlts.value : olts;
};

const fetchFiberhomeOnu = async () => {
  try {
    const response = await fetchApi.get("/listar-onu-fiberhome");

    return response.data.onus;
  } catch (error) {
    console.log("erro ao consultar olts fiberhome", error.message);
  }
};

const fetchAllOnu = async () => {
  const oltList =
    city && city !== "INDEFINIDO" ? filterOltsByCity(city) : heatmapOlts.value;

  const promiseList = oltList.map(async (olt) => {
    if (olt.oltName.includes("FIBERHOME")) {
      return await fetchFiberhomeOnu();
    }

    const onuData = await fetchApi.post("verificar-onu-name-olt", {
      oltIp: olt.ipv4,
    });

    return onuData.data;
  });

  const results = await Promise.allSettled(promiseList);

  const fulfilledData = results
    .filter((result) => result.status === "fulfilled")
    .map((result) => result.value);

  const rejectedErrors = results.filter(
    (result) => result.status === "rejected",
  );
  if (rejectedErrors.length) {
    console.error("Erros ao buscar ONUs:", rejectedErrors);
  }

  onuList.value = fulfilledData.flat();
  onuListCopy.value = onuList.value;

  vLanList.value = onuList.value
    .map((onu) => onu.flowProfile)
    .filter(Boolean)
    .reduce((acc, val) => {
      if (!acc.includes(val)) acc.push(val);
      return acc;
    }, []);
};

watch(query, () => {
  if (query.value) {
    query.value = query.value.split(" ").join("-").toUpperCase();
  }
});

const filterOnuList = computed(() => {
  if (!query.value || query.value.length < 4) return null;
  return onuList.value.filter((onu) => {
    if (onu.name) {
      return onu.name.includes(query.value);
    }
  });
});

watch(selectedVlan, (vlan) => {
  onuList.value = onuListCopy.value;
  onuList.value = onuList.value.filter((onu) => {
    return onu?.flowProfile == vlan;
  });
});

const findOnuListFromCto = () => {
  if (!clients) return;

  const names = clients.map((client) => {
    let nameWithHifen = "";
    if (client.name.includes("(")) {
      nameWithHifen = client.name.split("(")[0].trim().replaceAll(" ", "-");
    } else {
      nameWithHifen = client.name.trim().split(" ").join("-");
    }

    return nameWithHifen;
  });

  const onuMatchList = names
    .map((n) => {
      const suffix = n.split("-").at(-1);
      const preffix = n.split("-").at(0);

      const onu = onuList.value.find(
        (onu) =>
          (onu?.name?.endsWith(suffix) && onu?.name?.startsWith(preffix)) ||
          onu?.name?.includes(n),
      );

      return onu ? onu : false;
    })
    .filter((data) => data);

  if (!onuMatchList.length) {
    alert("Clientes não identificados na olt");
    emit("exit");
  } else {
    onuList.value = onuMatchList;
    onuListCopy.value = onuMatchList;
  }
};

const deleteOnu = (onu) => {
  onuList.value = onuList.value.filter((o) => o.mac !== onu.mac);
};

const updateAlias = (onu) => {
  onuList.value = onuList.value.map((o) => {
    if (o.mac === onu.mac) {
      o.name = onu.newAlias;
    }
    return o;
  });
};

const onuListLimited = computed(() => {
  return onuList.value.slice(0, renderLimit.value);
});

onMounted(async () => {
  await getOltList();
  await fetchAllOnu();
  findOnuListFromCto();
});
</script>

<template>
  <v-card style="min-height: 450px" class="overflow-auto" variant="flat">
    <slot name="header">
      <v-card-title class="bg-orange">
        <div class="d-flex justify-space-between align-center">
          <div class="d-flex">
            <p class="me-2">CPE´S LISTA</p>
            <v-icon>mdi-circle-box</v-icon>
          </div>
          <div>
            <v-btn variant="text" icon="mdi-close" @click="closeDialog"></v-btn>
          </div>
        </div>
      </v-card-title>
    </slot>
    <v-card-text>
      <slot name="search">
        <v-row no-gutters>
          <v-col cols="12">
            <v-text-field
              variant="outlined"
              label="Pesquisar cliente"
              append-inner-icon="mdi-magnify"
              single-line
              v-model="query"
              hide-details
              class="mb-3"
            ></v-text-field>
          </v-col>
          <v-col cols="12" class="mt-3">
            <v-autocomplete
              chips
              variant="outlined"
              label="Selecionar por Vlan"
              :items="vLanList"
              v-model="selectedVlan"
            ></v-autocomplete>
          </v-col>
        </v-row>
      </slot>
      <v-row no-gutters>
        <v-col cols="12">
          <div v-if="onuList.length">
            <OnuList
              :onu-list="filterOnuList || onuListLimited"
              @delete-onu="deleteOnu"
              @update-alias="updateAlias"
            />
          </div>
          <div v-else>
            <div class="d-flex justify-center align-center">
              <v-progress-circular
                color="orange"
                indeterminate
                :size="105"
                :width="9"
              ></v-progress-circular>
            </div>
            <p class="subtitle text-center text-warning mt-4">
              Carregando lista de clientes
            </p>
          </div>
        </v-col>
      </v-row>
    </v-card-text>
    <v-card-actions v-if="onuList.length > 20">
      <v-btn block color="primary" @click="renderLimit += 100"
        >Carregar mais</v-btn
      >
    </v-card-actions>
  </v-card>
</template>
