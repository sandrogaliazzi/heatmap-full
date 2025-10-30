<script setup>
import { ref } from "vue";
import Dialog from "../Dialog/Dialog.vue";

const openDialog = ref(false);
const event = ref({});

const { eventMarkers, visible } = defineProps(["eventMarkers", "visible"]);
const emit = defineEmits(["updateEvent"]);

const setWindowInfo = (info) => {
  event.value = info;
  openDialog.value = true;
};

import warningIcon from "@/assets/warning-icon.png";
import redWarningIcon from "@/assets/red-warning-icon.png";
</script>
<template>
  <Dialog :isOpen="openDialog">
    <v-sheet border="md" class="pa-6 text-white mx-auto" max-width="500">
      <h4 class="text-h5 font-weight-bold mb-4">
        Evento: <b>{{ event.title }}</b
        >⚠️
      </h4>

      <p>⏱<b>Início do Evento:</b> {{ event.startTime }}</p>

      <br />

      <p class="mb-8">
        {{ event.openDescription }}
        <br />
        <br />
        <b>Encerramento</b>
        <br />
        {{ event.closeDescription || "" }}
        <br />
        <br />

        <b>Status:</b>
        {{
          event.status !== "RESOLVIDO"
            ? `❌${event.status}❌`
            : `✅${event.status}✅`
        }}
        <br />
        <br />

        <span v-if="event.status === 'RESOLVIDO'"
          ><b>Evento encerrado:</b> {{ event.endTime }}</span
        >
        <span v-else
          ><b>Previsão de conclusão:</b>
          {{ event.timeToLive || "Indefinido" }}</span
        >
      </p>

      <template v-if="event.status !== 'RESOLVIDO'">
        <v-btn
          class="text-none text-black mb-4"
          color="orange"
          size="x-large"
          variant="flat"
          block
          @click="emit('updateEvent', { info: event, action: 'update' })"
        >
          Atualizar
        </v-btn>

        <v-btn
          class="text-none text-black mb-4"
          color="pink-accent-2"
          size="x-large"
          variant="flat"
          block
          @click="emit('updateEvent', { info: event, action: 'upchat' })"
        >
          Editar Notificação UpChat
        </v-btn>

        <v-btn
          class="text-none text-black mb-4"
          color="red-accent-2"
          size="x-large"
          variant="flat"
          block
          @click="emit('updateEvent', { info: event, action: 'close' })"
        >
          Encerrar Evento
        </v-btn>
      </template>

      <v-btn
        class="text-none text-black"
        color="red-accent-2"
        size="x-large"
        variant="outlined"
        @click="openDialog = false"
        block
      >
        Fechar Janela
      </v-btn>
    </v-sheet>
  </Dialog>
  <GMapMarker
    v-for="marker in eventMarkers"
    :key="marker._id"
    :animation="marker.status === 'RESOLVIDO' ? 2 : 1"
    :title="marker.title"
    :position="marker.eventLocale"
    :icon="marker.status === 'RESOLVIDO' ? warningIcon : redWarningIcon"
    :clickable="true"
    @click="setWindowInfo(marker)"
    :visible="visible || marker.status !== 'RESOLVIDO'"
  >
  </GMapMarker>
</template>
