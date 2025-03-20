<script setup>
import { ref, inject, watch, onUnmounted } from "vue";
import telegram from "@/api/telegramApi.js";
import fetchApi from "@/api";
const chat_id = import.meta.env.VITE_TELEGRAM_CHAT_ID;

const { eventLocale, event, eventAction } = defineProps([
  "eventLocale",
  "event",
  "eventAction",
]);
const emit = defineEmits(["closeMarker", "reloadEvents"]);

const eventCode = ref(100);
const title = ref(event.title || "");
const openDescription = ref(event.openDescription || "");
const closeDescription = ref("");
const timeToLive = ref(event.timeToLive || "");
const eventClass = ref(event.eventClass || "");
const startTime = ref(event.startTime || new Date().toLocaleString());
const closeDialog = inject("closeDialog");
const formRef = ref(null);

const inputRules = [
  (value) => {
    if (value) return true;

    return "Este campo é obrigatório";
  },
];

const googleMapsLink = (position) => {
  return `https://www.google.com/maps/search/?api=1&query=${position.lat},${position.lng}`;
};

const telegramMessage = (message) => {
  return `
  ⚠️ Evento: ${message.title}
  Cód: ${message.eventCode}

  Status: ❌NÃO RESOLVIDO❌

  Descrição:
  ${message.openDescription}

🌍 Localização aproximada: ${googleMapsLink(message.eventLocale)}

  Previsão de conclusão: INDEFINIDO
  `;
};

const updateTelegramMessage = (message) => {
  return `
  ⚠️Atualização Evento: ${message.title}

  ${eventAction === "close" ? "Status: ✅RESOLVIDO✅" : ""}

  Descrição:
  ${
    eventAction === "close" ? message.closeDescription : message.openDescription
  }

 ${
   eventAction === "close"
     ? ""
     : `🌍 Localização aproximada: ${googleMapsLink(message.eventLocale)}`
 }

  ${
    eventAction === "close"
      ? ""
      : `Previsão de conclusão: ${message.timeToLive || "INDEFINIDO"}`
  }
  `;
};

watch(title, (val) => (title.value = val.toUpperCase()));

const resetForm = () => {
  emit("reloadEvents");
  emit("closeMarker");
};

const sendMessageToTelegram = async (bodyRequest) => {
  try {
    const telegramResponse = await telegram.post("/sendMessage", {
      text: telegramMessage(bodyRequest),
      chat_id,
    });

    return telegramResponse.data.result.message_id;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const replyTelegramMessage = async (message, id) => {
  try {
    const telegramResponse = await telegram.post("/sendMessage", {
      text: updateTelegramMessage(message),
      chat_id,
      reply_to_message_id: id,
    });

    return telegramResponse.data.result.message_id;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const saveEvent = async (bodyRequest) => {
  const req = event._id
    ? {
        ...bodyRequest,
        _id: event._id,
      }
    : {
        ...bodyRequest,
      };
  try {
    const apiResponse = await fetchApi.post("/addevent", req);

    if (apiResponse.status === 200) {
      //do something
    } else {
      console.error(apiResponse);
    }

    //console.log(req);
  } catch (error) {
    throw error;
  }
};

const handleSubmit = async () => {
  const { valid } = await formRef.value.validate();

  if (valid) {
    const bodyRequest = {
      eventCode: eventCode.value,
      title: title.value,
      status: eventAction === "close" ? "RESOLVIDO" : "NÃO RESOLVIDO",
      eventClass: eventClass.value,
      startTime: startTime.value,
      endTime: new Date().toLocaleString(),
      timeToLive: timeToLive.value || "",
      openDescription: openDescription.value,
      eventLocale: markerPosition.value || eventLocale,
      closeDescription: closeDescription.value,
    };

    let message_id;

    switch (eventAction) {
      case "":
        message_id = await sendMessageToTelegram(bodyRequest);
        await saveEvent({ ...bodyRequest, message_id });
        break;

      case "update":
        message_id = await replyTelegramMessage(bodyRequest, event.message_id);
        await saveEvent({ ...bodyRequest, message_id });
        break;

      case "close":
        message_id = await replyTelegramMessage(bodyRequest, event.message_id);
        await saveEvent({
          ...bodyRequest,
          message_id,
        });
        break;
    }

    resetForm();
  }
};

const mapRef = ref(null);
const markerPosition = ref(event.eventLocale || null);

watch(mapRef, (googleMaps) => {
  if (googleMaps) {
    googleMaps.$mapPromise.then((mapInstance) => {
      mapInstance.addListener("click", (mapsMouseEvent) => {
        markerPosition.value = mapsMouseEvent.latLng.toJSON();
      });
    });
  }
});

onUnmounted(() => emit("closeMarker"));
</script>
<template>
  <v-card>
    <v-card-title class="bg-orange">
      <div class="d-flex justify-space-between align-center">
        <div class="d-flex">
          <p class="me-2">Adicionar Evento</p>
          <v-icon>mdi-alert</v-icon>
        </div>
        <v-btn variant="text" icon="mdi-close" @click="closeDialog"></v-btn>
      </div>
    </v-card-title>
    <v-card-text>
      <v-form
        @submit.prevent="handleSubmit"
        ref="formRef"
        class="mb-3"
        id="eventForm"
      >
        <template v-if="eventAction === 'close'">
          <v-row>
            <v-col>
              <v-text-field
            type="text"
            label="Título do evento"
            v-model="title"
            :rules="inputRules"
          >
              </v-text-field>
            </v-col>
          </v-row>
          <v-row>
            <v-col>
              <v-textarea
                clearable
                label="Encerramento"
                v-model="closeDescription"
              ></v-textarea>
            </v-col>
          </v-row>
        </template>

        <template v-else>
          <v-row>
            <v-col>
              <v-select
                label="Classificação"
                :items="['MANUTENÇÃO', 'DANO DE INFRAESTRUTURA']"
                v-model="eventClass"
                :rules="inputRules"
              ></v-select>
            </v-col>
            <v-col>
              <v-text-field
                type="text"
                label="Previsão fim"
                v-model="timeToLive"
              ></v-text-field>
            </v-col>
            <v-col>
              <v-text-field
                type="text"
                label="Protocólo"
                v-model="eventCode"
              ></v-text-field>
            </v-col>
          </v-row>

          <v-text-field
            type="text"
            label="Título do evento"
            v-model="title"
            :rules="inputRules"
          >
          </v-text-field>

          <v-textarea
            clearable
            label="Descrição"
            v-model="openDescription"
          ></v-textarea>
        </template>

        <template v-if="event.eventLocale && eventAction !== 'close'">
          <p><b>Editar Localização</b></p>
          <br />
          <GMapMap
            :center="event.eventLocale"
            :zoom="15"
            class="w-100 h-100"
            ref="mapRef"
            style="width: 100%; height: 16rem; border-radius: 20px"
          >
            <GMapMarker :position="markerPosition"> </GMapMarker>
          </GMapMap>

          <br />
        </template>

        <v-btn
          block
          color="success"
          size="large"
          type="submit"
          variant="elevated"
          @keyup.enter="handleSubmit"
        >
          Enviar
        </v-btn>
      </v-form>
    </v-card-text>
  </v-card>
</template>
