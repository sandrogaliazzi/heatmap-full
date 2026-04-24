<script setup>
import CtoNotes from "./CtoNotes.vue";

defineProps(["cto", "freePorts", "loading", "connections"]);
</script>

<template>
  <v-card-subtitle
    class="mt-3 font-weight-bold d-flex flex-wrap ga-2 justify-space-between align-center"
  >
    <div>
      {{ cto.city == "ZCLIENTES NÃO VERIFICADOS" ? "ARARICA" : cto.city }}
      |
      <span
        :class="
          !loading.freePorts && freePorts.freePorts <= 0
            ? 'text-error'
            : 'text-success'
        "
      >
        <template v-if="loading.freePorts">PORTAS ...</template>
        <template v-else>
          PORTAS {{ freePorts.totalPorts }} VAGAS
          {{ freePorts.freePorts < 0 ? 0 : freePorts.freePorts }}
        </template>
      </span>
    </div>

    <v-chip append-icon="mdi-note-text" link>
      ver anotações
      <CtoNotes
        :ctoId="cto.id"
        :connections="connections"
        :loading-connections="loading.connections"
      />
    </v-chip>
  </v-card-subtitle>
</template>
