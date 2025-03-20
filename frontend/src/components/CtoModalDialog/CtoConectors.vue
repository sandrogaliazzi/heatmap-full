<script setup>
import { retiradasDeConectorBot } from "@/api/telegramApi";
import { useUserStore } from "@/stores/user";

const chat_id = import.meta.env.VITE_TELEGRAM_CHAT_ID2;
const userStore = useUserStore();

const { conectorOsList, cto } = defineProps(["conectorOsList", "cto"]);

const telegramMessage = (info) => {
  return `
  ⚠️: ${info.cto}
🌍 Cidade: ${info.cidade}

📌: RETIRADO/RENOMEADO CONECTOR DE ${info.nome_razaosocial}
👷‍♂️: ${info.user}
   
⌚: ${new Date().toLocaleString()}
OS ID: ${info.codos}`;
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
    info.cto = cto;
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
        <div>
          <v-card
            v-for="conector in conectorOsList"
            :key="conector.codos"
            :title="conector.nome_razaosocial"
            variant="elevated"
            class="mb-3"
            link
          >
            <v-card-subtitle>
              <v-chip prepend-icon="mdi-map-marker" color="primary">
                {{ conector.cidade }}
              </v-chip>
            </v-card-subtitle>
            <template #prepend>
              <v-icon icon="mdi-connection" color="orange"></v-icon>
            </template>
            <v-card-text>
              <p>
                {{ conector.defeito_reclamado }}
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
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>
