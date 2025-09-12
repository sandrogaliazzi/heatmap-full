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

const oltListByCity = {
  "NOVA HARTZ": [
    { ip: "192.168.202.2", name: "PARKS 1" },
    { ip: "192.168.203.2", name: "PARKS 2" },
    { ip: "192.168.204.2", name: "PARKS 3" },
  ],
  SAPIRANGA: [
    { ip: "192.168.207.2", name: "PARKS 6" },
    { ip: "192.168.209.2", name: "PARKS 8" },
  ],
  ARARICA: [
    { ip: "192.168.207.2", name: "PARKS 6" },
    { ip: "192.168.209.2", name: "PARKS 8" },
  ],
  IGREJINHA: [
    { ip: "172.16.9.6", name: "PARKS 10" },
    { ip: "172.16.9.10", name: "PARKS 9" },
  ],
  "TRES COROAS": [{ ip: "172.16.9.10", name: "PARKS 9" }],
  PAROBE: [
    { ip: "192.168.212.2", name: "PARKS 12" },
    { ip: "192.168.213.2", name: "PARKS 13" },
  ],
  "M. PEDRA": [{ ip: "192.168.205.2", name: "PARKS 4" }],
  "FAZ. FIALHO": [
    { ip: "192.168.206.2", name: "PARKS 5" },
    { ip: "192.168.208.2", name: "PARKS 7" },
    { ip: "192.168.205.2", name: "PARKS 4" },
  ],
  "SÃO JOÃO DO DESERTO": [{ ip: "172.16.11.2", name: "PARKS 11" }],
  MORUNGAVA: [{ ip: "192.168.216.2", name: "PARKS 16" }],
};

const olts = [
  {
    ip: "192.168.202.2",
    name: "PARKS 1",
  },
  {
    ip: "192.168.203.2",
    name: "PARKS 2",
  },
  {
    ip: "192.168.204.2",
    name: "PARKS 3",
  },
  {
    ip: "192.168.205.2",
    name: "PARKS 4",
  },
  {
    ip: "192.168.206.2",
    name: "PARKS 5",
  },
  {
    ip: "192.168.207.2",
    name: "PARKS 6",
  },
  {
    ip: "192.168.208.2",
    name: "PARKS 7",
  },
  {
    ip: "192.168.209.2",
    name: "PARKS 8",
  },
  {
    ip: "192.168.212.2",
    name: "PARKS 12",
  },
  {
    ip: "192.168.213.2",
    name: "PARKS 13",
  },
  {
    ip: "172.16.9.10",
    name: "PARKS 9",
  },
  {
    ip: "172.16.9.6",
    name: "PARKS 10",
  },
  {
    ip: "172.16.11.2",
    name: "PARKS 11",
  },
  // {
  //   ip: "192.168.214.2",
  //   name: "PARKS 14",
  // },
  // {
  //   ip: "192.168.215.2",
  //   name: "PARKS 15",
  // },
  {
    ip: "192.168.216.2",
    name: "PARKS 16",
  },
];

const fetchFiberhomeOnu = async () => {
  try {
    const response = await fetchApi.get("/listar-onu-fiberhome");

    return response.data.onus;
  } catch (error) {
    console.log("erro ao consultar olts fiberhome", error.message);
  }
};

const fetchAllOnu = async () => {
  const oltList = city && city !== "INDEFINIDO" ? oltListByCity[city] : olts;
  const promiseList = oltList.map(async (olt) => {
    const onuData = await fetchApi.post("verificar-onu-name-olt", {
      oltIp: olt.ip,
    });
    return onuData.data;
  });

  const parksOnuData = await Promise.all(promiseList);
  const fiberhomeOnuData =
    city === "NOVA HARTZ" ? await fetchFiberhomeOnu() : [];
  onuList.value = [...parksOnuData.flat(), ...fiberhomeOnuData];
  onuListCopy.value = onuList.value;
  vLanList.value = onuList.value
    .map((onu) => {
      if (onu.flowProfile) return onu.flowProfile;
    })
    .filter((value) => value)
    .reduce((acc, val) => {
      if (!acc.includes(val)) {
        acc.push(val);
      }
      return acc;
    }, []);
};

watch(query, () => {
  if (query.value) {
    query.value = query.value.split(" ").join("-").toUpperCase();
  }
});

const filterOnuList = computed(() => {
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
      const onu = onuList.value.find((onu) => onu?.name?.includes(n));

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

onMounted(async () => {
  await fetchAllOnu();
  findOnuListFromCto();
});
</script>

<template>
  <v-card style="min-height: 450px" class="overflow-auto">
    <slot name="header">
      <v-card-title class="bg-orange">
        <div class="d-flex justify-space-between align-center">
          <div class="d-flex">
            <p class="me-2">ONUS PARKS</p>
            <v-icon>mdi-circle-box</v-icon>
          </div>
          <div>
            <v-btn variant="text" icon="mdi-close" @click="closeDialog"></v-btn>
          </div>
        </div>
      </v-card-title>
    </slot>
    <v-card-text>
      <v-container>
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
        <v-row no-gutters>
          <v-col cols="12">
            <div v-if="onuList.length">
              <OnuList :onu-list="filterOnuList || onuList" />
              <v-btn
                v-if="onuList.length <= 16"
                color="primary"
                @click="fetchAllOnu"
                variant="tonal"
                >VER TODOS</v-btn
              >
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
      </v-container>
    </v-card-text>
  </v-card>
</template>
