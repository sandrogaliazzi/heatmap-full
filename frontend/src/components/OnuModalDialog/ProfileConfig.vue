<script setup>
import { ref, watch, inject, onMounted } from "vue";
import TranslationConfig from "./TranslationConfig.vue";
import fetchApi from "@/api";
import gerarScriptOnu from "./gerarScript";
import { useNotificationStore } from "@/stores/notification";
import { useUserStore } from "@/stores/user";
import hubApi from "@/api/hubsoftApi";
import FiberhomeOnuConfig from "./FiberhomeOnuConfig.vue";
import { getClientNameByMAC } from "./util";

const notification = useNotificationStore();

const inputRules = [
  (value) => {
    if (value) return true;

    return "Este campo é obrigatório";
  },
];

const triggerNotification = (msg, status) => {
  notification.setNotification({
    msg,
    status,
  });
};

const gponProfiles = ref([]);
const selectedGponProfile = ref(null);
const oltList = ref();
const userStore = useUserStore();
const selectedOlt = ref(null);
const newOnu = ref("");
const editScript = ref(false);
const oltPon = ref("");
const dialog = ref(false);
const provisionDialog = ref(false);
const alias = ref("");
const formRef = ref(null);
const closeDialog = inject("closeDialog");
const hasClientBinding = ref(false);
const hasUnaddedOnu = ref(false);
const loading = ref(false);

const addOnu = () => {
  if (!newOnu.value || !oltPon.value) {
    alert("Preencha os campos ONU MAC e OLT PON");
    return;
  }

  const exists = unauthorizedOnuList.value.find(
    (onu) => onu.onuMac === newOnu.value,
  );
  if (exists) {
    alert("ONU já existe na lista");
    return;
  }

  unauthorizedOnuList.value.push({
    onuMac: newOnu.value,
    gpon: `gpon1/${oltPon.value}`,
    oltIp: selectedOlt.value.oltIp,
    onuType: "AN5506-01-A1",
  });

  newOnu.value = "";
  oltPon.value = "";
  dialog.value = false;
  hasUnaddedOnu.value = true;
};

const getOltList = async () => {
  try {
    const response = await fetchApi.get("listar-olt");
    return response.data.filter((olt) => olt.active);
  } catch (error) {
    console.log("erro ao buscar equipamentos", error.message);
  }
};

const id_cliente_servico = ref(null);

const configClientAuth = async () => {
  try {
    const response = await hubApi.post(
      "/api/v1/integracao/cliente/configurar_autenticacao",
      {
        id_cliente_servico: id_cliente_servico.value,
        phy_addr: selectedOnu.value.onuMac,
        observacoes: `Liberado via Heatmap por: ${
          userStore.user.name
        } - data: ${new Date().toLocaleString()}`,
      },
    );
    return response;
  } catch (error) {
    console.log("erro ao configurar cliente", error.message);
  }
};

const getGponProfiles = async () => {
  try {
    const response = await fetchApi.post("listar-perfis-gpon-parks", {
      oltIp: selectedOlt.value.ipv4,
    });
    if (response.status === 200) {
      gponProfiles.value = response.data;
    }
  } catch (error) {
    console.log("erro ao buscar perfis gpon", error.message);
  }
};

const unauthorizedOnuList = ref([]);
const selectedOnu = ref([]);

const getUnauthorizedOnuInfoFromFiberhome = async () => {
  try {
    const response = await fetchApi.post(
      "/listar-onu-fiberhome-nao-autorizadas",
      {
        oltIp: selectedOlt.value.oltIp,
      },
    );
    return response.data;
  } catch (error) {
    console.log("erro ao consultar olts fiberhome", error.message);
    loadingApi.value = false;
  }
};

const getUnauthorizedOnuFromParks = async () => {
  try {
    const response = await fetchApi.post("listar-onu", {
      oltIp: selectedOlt.value.ipv4,
    });

    return response.data;
  } catch (error) {
    console.log("erro ao consultar olts", error.message);
  }
};

const getUnauthorizedOnu = async () => {
  loading.value = true;
  if (selectedOlt.value) {
    if (selectedOlt.value.oltName.includes("FIBERHOME")) {
      unauthorizedOnuList.value = await getUnauthorizedOnuInfoFromFiberhome();
    } else {
      unauthorizedOnuList.value = await getUnauthorizedOnuFromParks();
    }
  }
  loading.value = false;
};

const cpePortsNumber = ref(0);
const isVEIPprofile = ref(false);

watch(selectedGponProfile, (newProfile) => {
  if (newProfile) {
    isVEIPprofile.value = newProfile.entries.some(
      (entry) => entry.type === "VEIP",
    );
    cpeBridgeTranslation.value = {};
    translationSelection.value = null;
    const pbmpPorts = selectedGponProfile.value.entries.map((entry) =>
      Number.parseInt(entry.pbmpPorts) ? Number.parseInt(entry.pbmpPorts) : 0,
    );
    cpePortsNumber.value =
      Math.max(...pbmpPorts) > 0 ? Math.max(...pbmpPorts) : 1;
  }
});

const vlanTranslations = ref([]);

const getVlanTranslations = async () => {
  try {
    const response = await fetchApi.post("listar-vlan-translation", {
      oltIp: selectedOlt.value.ipv4,
    });
    if (response.status === 200) {
      vlanTranslations.value = response.data;
    }
  } catch (error) {
    console.log("erro ao buscar vlan translations", error.message);
  }
};

const cpeBridgeTranslation = ref({});
const translationSelection = ref(null);

const mountCpeBridgeScript =  () => {
  return gerarScriptOnu(
    selectedOnu.value.map((onu, index) => ({
      vlanData: cpeBridgeTranslation.value,
      flowProfile: selectedGponProfile.value.name,
      alias: selectedOnu.value[index]?.name || alias.value || `ONU-ALIAS-${onu.onuMac.slice(-4)}`,
      mac: onu.onuMac,
      hasUnaddedOnu: hasUnaddedOnu.value,
    })),
  );
};

const mountCpeVEIPprofile = () => {
  const script = [];
  const parts = [];

  for(const onu of selectedOnu.value) {
    if (hasUnaddedOnu.value) {
    parts.push(`onu add serial-number ${onu.onuMac}`);
  }
  parts.push(
    `onu ${onu.onuMac} ethernet-profile auto-on uni-port 1-${selectedGponProfile.value.entries.length + 1}`,
  );
  parts.push(`onu ${onu.onuMac} upstream-fec disabled`);
  parts.push(
    `onu ${onu.onuMac} flow-profile ${selectedGponProfile.value.name}`,
  );
  parts.push(
    `onu ${onu.onuMac} alias ${onu?.name || alias.value || "ONU-ALIAS"}`,
  );

  script.push(parts.join("\n"));

  parts.length = 0;
  }

  return script;
};

const script = ref("");

const handleSubmit = async () => {
  const { valid } = await formRef.value.validate();

  if (!valid) {
    triggerNotification("Preencha os campos obrigatórios!", "error");
    return;
  }
  if (isVEIPprofile.value) {
    script.value = mountCpeVEIPprofile();
  } else if (isFiberome.value) {
    script.value = fiberhomeConfig.value.mountFiberhomeScript(selectedOnu.value, alias.value);
  } else {
    script.value = mountCpeBridgeScript();
  }

  provisionDialog.value = true;
};

const onProvision = ref(false);

const provisionOnu = async () => {

  for(const onu of selectedOnu.value) {
   
  const requestBody = {
    oltIp: selectedOlt.value.oltIp,
    oltPon: onu.gpon,
    script: script.value.find((part) => part.includes(onu.onuMac)),
    hasUnaddedOnu: hasUnaddedOnu.value,
    onuAlias: alias.value || `ONU-ALIAS-${onu.onuMac.slice(-4)}`,
    slot: fiberhomeConfig.value?.slot,
    pon: fiberhomeConfig.value?.pon,
  };

  onProvision.value = true;

  if (hasClientBinding.value && !id_cliente_servico.value) {
    triggerNotification("Informe o ID do serviço do cliente!", "error");
    onProvision.value = false;
    return;
  } else if (hasClientBinding.value && id_cliente_servico.value) {
    const response = await configClientAuth();

    if (response.data.status !== "success") {
      triggerNotification(
        `Erro ao vincular cliente ao serviço! ${response.data.msg}`,
        "error",
      );
    } else {
      triggerNotification(
        "Cliente vinculado ao serviço com sucesso!",
        "success",
      );
    }
  }

  try {
    const response = isFiberome.value
      ? await fetchApi.post("liberar-onu-fiberhome-avulsa", requestBody)
      : await fetchApi.post("liberar-onu-avulsa", requestBody);
    if (response.status === 200) {
      triggerNotification("ONU provisionada com sucesso!", "success");
    }
  } catch (error) {
    console.log("erro ao provisionar onu", error.message);
    triggerNotification("Erro ao provisionar ONU!", "error");
  }
  await new Promise((resolve) => setTimeout(resolve, 2000));

}

  editScript.value = false;
  script.value = "";
  selectedOlt.value = null;
  selectedOnu.value = [];
  unauthorizedOnuList.value = [];
  selectedGponProfile.value = null;
  cpePortsNumber.value = 0;
  cpeBridgeTranslation.value = {};
  translationSelection.value = null;
  onProvision.value = false;
  provisionDialog.value = false;
};

const toggleOnuSelection = () => {
  if (selectedOnu.value.length > 0) {
    selectedOnu.value = [];
  } else {
    selectedOnu.value = [...unauthorizedOnuList.value];
  }
};

const itemProps = (item) => {
  return {
    title: item.onuMac,
    subtitle: item.slot ? `Slot: ${item.slot} - Pon: ${item.pon}` : item.gpon,
  };
}

const isFiberome = ref(false);
const fiberhomeConfig = ref("");

watch(selectedOlt, (newOlt) => {
  if (newOlt) {
    selectedOnu.value = [];
    if (newOlt.oltName.includes("FIBERHOME")) isFiberome.value = true;
    else {
      getGponProfiles();
      getVlanTranslations();
      isFiberome.value = false;
    }
    getUnauthorizedOnu();
  }
});

watch(
  () => selectedOnu.value.map(o => o?.onuMac),
  async (macs) => {
    if(!macs) return;
    if (macs.length > 1) {
      const aliasFormat = selectedOlt.value.oltName.includes("FIBERHOME")
        ? "fiberhome"
        : "parks";

      const response = await Promise.all(
        macs.map((mac) =>
          getClientNameByMAC(mac, aliasFormat)
        )
      );

      console.log("alias encontrados", response);

      selectedOnu.value.forEach((onu, index) => {
        onu.name = response[index].name;
      });
    }
  }
);

onMounted(async () => {
  oltList.value = await getOltList();
});
</script>

<template>
  <v-card :loading="loading">
    <v-card-title class="bg-orange">
      <div class="d-flex justify-space-between align-center">
        <div class="d-flex">
          <p class="me-2">Provisionar Cpe Avulsa</p>
          <v-icon>mdi-set-top-box</v-icon>
        </div>
        <div>
          <v-btn variant="text" icon="mdi-close" @click="closeDialog"></v-btn>
        </div>
      </div>
    </v-card-title>
    <v-card-text>
      <v-form @submit.prevent="handleSubmit" ref="formRef">
        <v-row>
          <v-col cols="12">
            <v-select
              label="SELECIONAR OLT"
              :items="oltList"
              :item-title="(item) => item.oltName"
              :item-value="(item) => item"
              v-model="selectedOlt"
              :rules="inputRules"
            ></v-select>
          </v-col>
        </v-row>
        <v-row align="center">
          <v-col cols=2>
            <v-btn icon="mdi-refresh" variant="plain" @click="getUnauthorizedOnu" color="primary"></v-btn> 
          </v-col>
          <v-col cols="8">
            <v-select
              v-if="unauthorizedOnuList.length > 0"
              label="SELECIONAR ONU"
              :items="unauthorizedOnuList"
              :item-props="itemProps"
              :item-value="(item) => item"
              v-model="selectedOnu"
              :rules="inputRules"
              multiple
              chips
            >
              <template v-slot:prepend-item>
                <v-btn
                  color="primary"
                  variant="plain"
                  block
                  @click="toggleOnuSelection"
                  >Selecionar todas</v-btn
                >
              </template>
            </v-select>
          </v-col>
          <v-col cols="2">
            <v-btn
              color="primary"
              variant="text"
              class="mt-2"
              block
              @click="dialog = true"
            >
              Add
              <v-dialog v-model="dialog" width="500">
                <v-sheet color="grey-darken-4">
                  <v-container>
                    <v-form class="d-flex flex-column justify-center ga-3">
                      <v-text-field
                        label="ONUC MAC"
                        v-model="newOnu"
                        variant="underlined"
                      ></v-text-field>
                      <v-text-field
                        label="OLT PON"
                        type="number"
                        v-model="oltPon"
                        variant="underlined"
                      ></v-text-field>
                      <div>
                        <v-btn
                          icon="mdi-content-save-outline"
                          color="primary"
                          @click="addOnu"
                        ></v-btn>
                        <v-btn
                          icon="mdi-close"
                          color="error"
                          class="ml-2"
                          @click="dialog = false"
                        ></v-btn>
                      </div>
                    </v-form>
                  </v-container>
                </v-sheet>
              </v-dialog>
            </v-btn>
          </v-col>
        </v-row>

        <v-row v-if="selectedOnu.length === 1">
          <v-col>
            <v-text-field label="ALIAS" v-model="alias"></v-text-field>
          </v-col>
        </v-row>

        <v-row v-if="selectedOnu.length === 1">
          <v-col cols="8">
            <v-switch
              label="Vincular ao serviço do cliente"
              color="orange"
              v-model="hasClientBinding"
            ></v-switch>
          </v-col>
          <v-col cols="4" v-if="hasClientBinding">
            <v-text-field
              label="ID SERVIÇO"
              type="number"
              v-model="id_cliente_servico"
              :rules="inputRules"
            ></v-text-field>
          </v-col>
        </v-row>

        <template v-if="!isFiberome">
          <v-row>
            <v-col cols="12">
              <v-select
                v-if="gponProfiles.length > 0"
                label="SELECIONAR PERFIL"
                :items="gponProfiles"
                :item-title="(item) => item.name"
                :item-value="(item) => item"
                v-model="selectedGponProfile"
                :rules="inputRules"
              ></v-select>
            </v-col>
          </v-row>

          <template v-if="cpePortsNumber && !isVEIPprofile">
            <v-row v-for="n in cpePortsNumber" :key="n">
              <TranslationConfig
                :vlanTranslations="vlanTranslations"
                :port-number="n"
                v-model:profile="selectedGponProfile"
                v-model:cpeBridgeTranslation="cpeBridgeTranslation"
                @set-translation-config="translationSelection = $event"
              />
            </v-row>
          </template>
        </template>
        <template v-else-if="isFiberome">
          <FiberhomeOnuConfig
            ref="fiberhomeConfig"
            v-if="selectedOnu"
            :onu="selectedOnu"
          />
        </template>
        <br />

        <v-btn
          block
          color="success"
          size="large"
          type="submit"
          variant="outlined"
          @keyup.enter="handleSubmit"
        >
          GERAR SCRIPT
          <v-dialog
            v-model="provisionDialog"
            min-width="400px"
            max-width="800px"
          >
            <v-card :loading="onProvision">
              <v-card-text>
                <v-sheet
                  v-if="!editScript"
                  color="grey-darken-3"
                  rounded
                  class="pa-4"
                >
                  <p class="overflow-x-auto" v-for="part in script" :key="part">
                    <pre>{{ part }}</pre>
                    <v-divider></v-divider>
                    <br />
                  </p>
                </v-sheet>
                <v-textarea v-else v-model="script"></v-textarea>
              </v-card-text>
              <v-card-actions>
                <v-btn @click="editScript = !editScript"> Editar script</v-btn>
                <v-btn
                  color="success"
                  @click="provisionOnu"
                  :loading="onProvision"
                  >Provisionar onu</v-btn
                >
              </v-card-actions>
            </v-card>
          </v-dialog>
        </v-btn>
      </v-form>
    </v-card-text>
  </v-card>
</template>
