<script setup>
const { authorizedOnu } = defineProps(["authorizedOnu"]);
const emit = defineEmits(["update:refreshList"]);
</script>

<template>
  <v-sheet
    elevation="12"
    max-width="600"
    rounded="lg"
    width="100%"
    class="pa-4 text-center mx-auto"
  >
    <v-icon
      class="mb-5"
      color="success"
      icon="mdi-check-circle"
      size="112"
    ></v-icon>

    <h2 class="text-h5 mb-6">ONU Liberada com sucesso</h2>

    <ul>
      <li>
        <p class="text-medium-emphasis text-body-2">
          CLIENTE: {{ authorizedOnu.onuAlias }}
        </p>
      </li>
      <li>
        <p class="text-medium-emphasis text-body-2">
          ONU: {{ authorizedOnu.onuMac.toUpperCase() }}
        </p>
      </li>
      <li>
        <p class="text-medium-emphasis text-body-2">
          SINAL: {{ authorizedOnu.signal.tx }} {{ authorizedOnu.signal.rx }}
        </p>
      </li>
      <li>
        <p class="text-medium-emphasis text-body-2">
          TEC: {{ authorizedOnu.tecnico }}
        </p>
      </li>
      <li>
        <p class="text-medium-emphasis text-body-2">
          CTO: {{ authorizedOnu.cto }}
        </p>
      </li>
    </ul>

    <v-divider class="my-4"></v-divider>
    <div class="text-end">
      <v-btn
        class="text-none"
        color="success"
        rounded
        variant="flat"
        width="90"
        @click="emit('update:refreshList')"
      >
        Voltar
      </v-btn>
    </div>
  </v-sheet>
</template>

<style scoped>
ul {
  list-style: none;
}
</style>
