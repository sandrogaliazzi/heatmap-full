<script setup>
import { ref, onMounted } from "vue";
import { retiradasDeConectorBot } from "@/api/telegramApi";
import { useUserStore } from "@/stores/user";
import { getOsByTypeCtoAndCity, closeOs } from "./hubApi.js";

const chat_id = import.meta.env.VITE_TELEGRAM_CHAT_ID2;
const userStore = useUserStore();

const { cto } = defineProps(["cto"]);

const conectorOsList = ref([]);
const isHubApiLoading = ref(true);
const user = userStore.user;

const getHubSoftRetiradasDeConector = async (cto) => {
  try {
    const response = await getOsByTypeCtoAndCity(cto.name, cto.city);
    return response;
  } catch (error) {
    console.log(error);
    return [];
  }
};

const closeOsApi = async (id) => {
  try {
    const response = await closeOs(id, user.name);
    console.log(response);
  } catch (error) {
    console.log("erro ao fechar os", error);
  }
};

onMounted(async () => {
  conectorOsList.value = await getHubSoftRetiradasDeConector(cto);
  isHubApiLoading.value = false;
});

const telegramMessage = (info) => {
  return `
  ⚠️: ${info.cto}
🌍 Cidade: ${info.dados_endereco_instalacao.cidade}

📌: RETIRADO/RENOMEADO CONECTOR DE ${info.cliente}
👷‍♂️: ${info.user}
   
⌚: ${new Date().toLocaleString()}
OS ID: ${info.id_ordem_servico}`;
};

const sendMessageToTelegram = async (bodyRequest) => {
  try {
    const telegramResponse = await retiradasDeConectorBot.post("/sendMessage", {
      text: telegramMessage(bodyRequest),
      chat_id,
    });

    return telegramResponse.data.result.message_id;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const createMessage = (info) => {
  if (confirm("Confirmar esta ação?")) {
    info.cto = cto.name;
    info.user = userStore.user.name;
    info.retirado = true;

    try {
      sendMessageToTelegram(info);
      alert("Ação confirmada");
    } catch (error) {
      console.log(error);
    }
  }
};
</script>

<template>
  <v-container>
    <v-row no-gutters>
      <v-col cols="12">
        <div v-if="!isHubApiLoading">
          <template v-if="conectorOsList.length > 0">
            <v-card
              v-for="conector in conectorOsList"
              :key="conector.id_ordem_servico"
              :title="conector.cliente"
              variant="elevated"
              class="mb-3"
              link
            >
              <v-card-subtitle>
                <v-chip prepend-icon="mdi-map-marker" color="primary">
                  {{ conector.dados_endereco_instalacao.cidade }}
                </v-chip>
              </v-card-subtitle>
              <template #prepend>
                <v-icon icon="mdi-connection" color="orange"></v-icon>
              </template>
              <v-card-text>
                <p>
                  {{ conector.descricao_abertura }}
                </p>
              </v-card-text>
              <v-card-actions>
                <v-btn
                  v-if="!conector.retirado"
                  color="primary"
                  variant="tonal"
                  @click="createMessage(conector)"
                >
                  Confirmar retirada
                </v-btn>
                <v-btn v-else color="success" variant="tonal">
                  Conector retirado
                </v-btn>
              </v-card-actions>
            </v-card>
          </template>
          <v-sheet
            v-else
            :height="400"
            class="d-flex flex-column justify-center align-center"
          >
            <v-icon size="200px">mdi-power-plug-off</v-icon>
            <p class="text-button">Nenhum conector cadastrado</p>
          </v-sheet>
        </div>
        <v-sheet
          v-else
          :height="400"
          class="d-flex justify-center align-center"
        >
          <v-progress-circular
            color="orange"
            indeterminate
            :size="128"
            :width="6"
          ></v-progress-circular>
        </v-sheet>
      </v-col>
    </v-row>
  </v-container>
</template>
