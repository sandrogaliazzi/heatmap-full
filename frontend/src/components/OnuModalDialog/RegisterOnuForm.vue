<script setup>
import { ref, watch, onMounted } from "vue";
import { useUserStore } from "@/stores/user";
import { useNotificationStore } from "@/stores/notification";
import fetchApi from "@/api";
import hubApi from "@/api/hubsoftApi";
import { getApiErrorMessage } from "@/utils/apiError";

const { formData, hubsoftData } = defineProps(["formData", "hubsoftData"]);
const emit = defineEmits([
  "update:windowNumber",
  "update:onuRegisterWithSuccess",
]);
const notification = useNotificationStore();
const triggerError = (message) => {
  notification.setNotification({
    status: "error",
    msg: message,
  });
};

const formRef = ref(null);
const cto = ref(hubsoftData?.cto);
const tecnico = ref("");
const userStore = useUserStore();
const loadingSubmit = ref(false);
const isDisabledVlanInput = ref(true);
const clientsFound = ref([]);
const search = ref("");
const selectedClient = ref(hubsoftData?.selectedClient);
const selectedService = ref(hubsoftData?.selectedService);
const interfaces = ref([]);
const selectedInterface = ref(hubsoftData?.selectedInterface);
const useVeipService = ref(false);
const ssid = ref("");
const wifiPassword = ref("");

const inputRules = [
  (value) => {
    if (value) return true;

    return "Este campo é obrigatório";
  },
];

const loadInterfaces = async () => {
  try {
    const response = await hubApi.get("api/v1/integracao/rede/equipamento");
    if (response.status === 200) {
      interfaces.value = response.data.equipamentos
        .map((equip) =>
          equip.interfaces.map((interface_) => ({
            ...interface_,
            nome_equipamento: equip.nome,
          })),
        )
        .flat();
    }
  } catch (error) {
    triggerError(
      getApiErrorMessage(
        error,
        "Nao foi possivel carregar as interfaces disponiveis.",
      ),
    );
  }
};

const toParksTextFormat = (text) => text.replace(/\s+/g, "-").toUpperCase();

const debounce = (fn, delay) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      fn(...args);
    }, delay);
  };
};

const loadingClients = ref(false);

const searchClientByName = debounce(async (alias) => {
  if (alias.length < 3) return;
  loadingClients.value = true;
  try {
    const response = await hubApi.get(
      `api/v1/integracao/cliente?busca=nome_razaosocial&termo_busca=${alias}`,
    );
    if (response.status === 200) {
      clientsFound.value = response.data.clientes;
    }
  } catch (error) {
    triggerError(
      getApiErrorMessage(error, "Nao foi possivel buscar o cliente informado."),
    );
  } finally {
    loadingClients.value = false;
  }
}, 500);

watch(search, searchClientByName);

const configClientAuth = async () => {
  try {
    const response = await hubApi.post(
      "/api/v1/integracao/cliente/configurar_autenticacao",
      {
        id_cliente_servico: selectedService.value.id_cliente_servico,
        id_interface_conexao: selectedInterface.value,
        phy_addr: formData.onuMac,
        observacoes: `Liberado via Heatmap por: ${
          userStore.user.name
        }, técnico no local: ${toParksTextFormat(
          tecnico.value,
        )}, CTO: ${toParksTextFormat(
          cto.value,
        )} - data ${new Date().toLocaleString()}`,
      },
    );
  } catch (error) {
    throw new Error(
      getApiErrorMessage(
        error,
        "Nao foi possivel configurar a autenticacao do cliente.",
      ),
    );
  }
};

const provisionOnuParks = async (requestBody) => {
  try {
    const response = await fetchApi.post("liberar-onu", requestBody);
    if (response.status === 200) {
      loadingSubmit.value = false;

      emit("update:onuRegisterWithSuccess", {
        ...requestBody,
        signal: {
          tx: formData["Power Level"],
          rx: formData["RSSI"],
        },
      });
    }
  } catch (error) {
    loadingSubmit.value = false;
    triggerError(
      getApiErrorMessage(error, "Nao foi possivel provisionar a ONU."),
    );
  }
};

const normalizeName = (name) => {
  name.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const firstName = name.split(" ")[0];
  const lastName = name.split(" ").pop();
  return `${firstName} ${lastName} ${selectedService.value.id_cliente_servico}`;
};

const provisionOnuFiberhome = async (requestBody) => {
  try {
    const response = await fetchApi.post("liberar-onu-fiberhome", {
      slot: formData.slot,
      pon: formData.pon,
      vlan: formData.ponVlan,
      onuAlias: normalizeName(selectedClient.value.nome_razaosocial),
      onuType: formData.onuType,
      mac: formData.onuMac,
      oltIp: formData.oltIp,
      useVeipService: useVeipService.value,
    });
    if (response.status === 200) {
      loadingSubmit.value = false;

      emit("update:onuRegisterWithSuccess", {
        ...requestBody,
        signal: {
          tx: "",
          rx: "",
        },
      });
    }
  } catch (error) {
    loadingSubmit.value = false;
    triggerError(
      getApiErrorMessage(
        error,
        "Nao foi possivel provisionar a ONU FiberHome.",
      ),
    );
  }
};

const getClientPasswordsFromHubsoft = async () => {
  try {
    const response = await hubApi.get(
      `api/v1/integracao/cliente/cliente_servico/${selectedService.value.id_cliente_servico}/senhas`,
    );
    if (response.status === 200) {
      const clientPasswords = response.data.cliente_servico_senha;                                                                              
      const {usuario, senha} = clientPasswords.find(senha => senha.descricao == "SSID_E_SENHA_WIFI") || {};
      ssid.value = usuario;
      wifiPassword.value = senha;
    }
  } catch (error) {
    triggerError(
      getApiErrorMessage(
        error,
        "Nao foi possivel obter as senhas do cliente no HubSoft.",
      ),
    );
  }
};

const handleSubmit = async () => {
  const { valid } = await formRef.value.validate();

  if (valid) {
    loadingSubmit.value = true;

    const requestBody = {
      oltIp: formData.oltIp,
      oltPon: formData.oltPon,
      onuVlan: formData.ponVlan,
      cto: toParksTextFormat(cto.value),
      tecnico: toParksTextFormat(tecnico.value),
      onuSerial: formData.onuMac,
      user: userStore.user.name || "Usuário desconhecido",
      onuMac: formData.onuMac,
      gpon: formData.gpon,
      onuModel: formData.onuModel,
      oltRamal: formData.oltRamal,
      onuAlias: toParksTextFormat(
        normalizeName(selectedClient.value.nome_razaosocial.slice(0, 40)),
      ),
      sinalTX: formData["Power Level"],
      sinalRX: formData["RSSI"],
      useVeipService: useVeipService.value,
    };

    try {
      await configClientAuth();
    } catch (error) {
      loadingSubmit.value = false;
      triggerError(error.message);
      return;
    }

    if (formData.oltName.includes("FIBERHOME")) {
      await provisionOnuFiberhome(requestBody);
    } else {
      await provisionOnuParks(requestBody);
    }
  }
};

onMounted(() => {
  loadInterfaces();
  getClientPasswordsFromHubsoft();
});
</script>

<template>
  <v-form @submit.prevent="handleSubmit" ref="formRef">
    <v-row>
      <v-col cols="6">
        <v-text-field
          :label="formData.onuMac.toUpperCase()"
          disabled
        ></v-text-field>
      </v-col>
      <v-col cols="6">
        <v-text-field
          :label="`${formData['Power Level']} ${formData['RSSI']}`"
          disabled
        ></v-text-field>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="6">
        <v-text-field
          v-model="cto"
          :rules="inputRules"
          clearable
          label="CTO"
          prepend-inner-icon="mdi-cube"
          placeholder="Digite o nome da cto"
        ></v-text-field>
      </v-col>
      <v-col cols="6">
        <v-text-field
          v-model="formData.ponVlan"
          label="VLAN"
          prepend-inner-icon="mdi-web"
          append-inner-icon="mdi-pencil"
          @click:append-inner="isDisabledVlanInput = !isDisabledVlanInput"
          :readonly="isDisabledVlanInput"
        >
        </v-text-field>
      </v-col>
    </v-row>

    <v-autocomplete
      v-model="selectedClient"
      :rules="inputRules"
      clearable
      @update:search="search = $event"
      label="CLIENTE"
      :items="clientsFound || []"
      :item-title="(item) => item.nome_razaosocial"
      :item-value="(item) => item"
      prepend-inner-icon="mdi-account"
      placeholder="Digite o nome da cliente"
      :loading="loadingClients"
    ></v-autocomplete>

    <v-select
      v-if="selectedClient"
      label="SELECIONAR SERVIÇO"
      :items="selectedClient.servicos"
      :item-title="
        (item) => item.login || item.nome + ' (serviço sem autenticação)'
      "
      :item-value="(item) => item"
      :rules="inputRules"
      prepend-inner-icon="mdi-cog"
      v-model="selectedService"
    ></v-select>

    <v-autocomplete
      v-model="selectedInterface"
      :rules="inputRules"
      clearable
      label="INTERFACE"
      :items="interfaces || []"
      :item-title="(item) => `${item.nome} - ${item.nome_equipamento}`"
      :item-value="(item) => item.id_interface_conexao"
      prepend-inner-icon="mdi-hdmi-port"
      placeholder="Selecione a interface"
    ></v-autocomplete>

    <v-row>
      <v-col col-md="6">
        <v-text-field
        v-model="ssid"
        label="ssid"
        prepend-inner-icon="mdi-wifi"
        >

        </v-text-field>
      </v-col>
      <v-col col-md="6">
        <v-text-field
        v-model="wifiPassword"
        label="senha wifi"
        prepend-inner-icon="mdi-lock"
        >

        </v-text-field>
      </v-col>
    </v-row>

    <v-text-field
      v-model="tecnico"
      :rules="inputRules"
      clearable
      label="Tecnico"
      prepend-inner-icon="mdi-tools"
      placeholder="Digite o nome da Técnico"
    ></v-text-field>

    <v-checkbox
      label="perfil router veip"
      color="orange"
      v-model="useVeipService"
    ></v-checkbox>

    <br />

    <v-btn
      block
      color="success"
      size="large"
      type="submit"
      variant="elevated"
      :disabled="loadingSubmit"
      :loading="loadingSubmit"
      @keyup.enter="handleSubmit"
    >
      LIBERAR ONU
    </v-btn>
  </v-form>
</template>
