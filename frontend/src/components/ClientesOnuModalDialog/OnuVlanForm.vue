<script setup>
import { computed, ref, watch, onMounted, inject } from "vue";
import fetchApi from "@/api";
import { getApiErrorMessage } from "@/utils/apiError";
import { useNotificationStore } from "@/stores/notification";

const props = defineProps({
  onu: {
    type: Object,
    required: true,
  },
});

const vlanTranslations = ref([]);
const gponProfiles = ref([]);
const selectedGponProfile = ref(null);
const selectedVlanTranslation = ref(null);
const notification = useNotificationStore();
const closeDialog = inject("closeDialog");

const triggerNotification = (msg, status) => {
  notification.setNotification({
    msg,
    status,
  });
};

const getGponProfiles = async (oltIp) => {
  try {
    const response = await fetchApi.post("listar-perfis-gpon-parks", {
      oltIp: oltIp,
    });
    if (response.status === 200) {
      gponProfiles.value = response.data;
    }
  } catch (error) {
    gponProfiles.value = [];
    triggerNotification(
      getApiErrorMessage(error, "Nao foi possivel carregar os perfis GPON."),
      "error",
    );
  }
};

const getVlanTranslations = async (oltIp) => {
  try {
    const response = await fetchApi.post("listar-vlan-translation", {
      oltIp: oltIp,
    });
    if (response.status === 200) {
      vlanTranslations.value = response.data;
    }
  } catch (error) {
    vlanTranslations.value = [];
    triggerNotification(
      getApiErrorMessage(
        error,
        "Nao foi possivel carregar as configuracoes de VLAN da OLT.",
      ),
      "error",
    );
  }
};

const fetchConfigurations = async () => {
  await getGponProfiles(props.onu.oltIp);
  await getVlanTranslations(props.onu.oltIp);
};

const loading = ref(false);

onMounted(async () => {
  loading.value = true;
  await fetchConfigurations();
  loading.value = false;
});

const form = ref(null);

const inputRules = [(v) => !!v || "Campo obrigatorio"];

const isVeipProfile = computed(() => {
  const profile = selectedGponProfile.value;
  if (!profile) return false;

  return (
    profile.entries?.some((entry) => entry.type === "VEIP") ||
    /veip/i.test(profile.name || "")
  );
});

watch(isVeipProfile, (isVeip) => {
  if (isVeip) {
    selectedVlanTranslation.value = null;
  }
});

const vlanTranslationRules = [
  (v) => isVeipProfile.value || !!v || "Campo obrigatorio",
];

const generateScript = (onu) => {
  const script = [];
  script.push(`no onu ${onu.mac}`);
  script.push(`onu add serial-number ${onu.mac}`);
  script.push(`onu ${onu.mac} upstream-fec disabled`);
  script.push(`onu ${onu.mac} flow-profile ${selectedGponProfile.value.name}`);
  if (!isVeipProfile.value) {
    script.push(
      `onu ${onu.mac} vlan-translation-profile ${selectedVlanTranslation.value.name} uni-port 1`,
    );
  }
  script.push(`onu ${onu.mac} alias ${onu.name}`);
  return script.join("\n");
};

const handleSubmit = async () => {
  if (!props.onu?.oltGpon) {
    triggerNotification(
      "Configuracao de VLAN disponivel apenas para ONUs Parks.",
      "error",
    );
    return;
  }

  const { valid } = await form.value.validate();
  if (!valid) {
    triggerNotification(
      "Por favor, preencha todos os campos obrigatorios.",
      "error",
    );
    return;
  }

  if (!selectedGponProfile.value) {
    triggerNotification("Selecione um perfil GPON.", "error");
    return;
  }

  if (!isVeipProfile.value && !selectedVlanTranslation.value) {
    triggerNotification("Selecione uma VLAN translation.", "error");
    return;
  }

  loading.value = true;
  try {
    const requestBody = {
      oltIp: props.onu.oltIp,
      oltPon: props.onu?.oltGpon,
      script: generateScript(props.onu),
      hasUnaddedOnu: false,
      onuAlias: props.onu.name,
      slot: null,
      pon: null,
    };

    await fetchApi.post("liberar-onu-avulsa", requestBody);
    triggerNotification("Configuracoes salvas com sucesso!", "success");
  } catch (error) {
    triggerNotification(
      getApiErrorMessage(error, "Erro ao salvar as configuracoes."),
      "error",
    );
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <v-card :loading="loading" title="EDITAR VLAN" prepend-icon="mdi-ethernet">
    <template #append>
      <v-btn icon="mdi-close" variant="text" @click="closeDialog"></v-btn>
    </template>
    <v-card-text>
      <v-form ref="form" @submit.prevent="handleSubmit">
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
          <v-col>
            <v-select
              v-if="vlanTranslations.length > 0"
              label="SELECIONAR VLAN TRANSLATION"
              :items="vlanTranslations"
              :item-title="(item) => item?.name"
              :item-value="(item) => item"
              v-model="selectedVlanTranslation"
              :disabled="isVeipProfile"
              :rules="vlanTranslationRules"
            ></v-select>
          </v-col>
        </v-row>
        <v-btn
          prepend-icon="mdi-content-save"
          color="green"
          type="submit"
          variant="text"
          block
          :disabled="loading"
          :loading="loading"
        >
          Salvar Configuracoes
        </v-btn>
      </v-form>
    </v-card-text>
  </v-card>
</template>
