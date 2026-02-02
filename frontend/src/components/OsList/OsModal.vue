<script setup>
defineProps({
  os: {
    type: Object,
    required: true,
  },
});

const model = defineModel();
</script>
<template>
  <v-dialog v-model="model" max-width="900">
    <v-card
      :title="os?.cliente"
      :subtitle="`${os?.tipo} - ${os?.numero}`"
      prepend-icon="mdi-flag-variant"
      rounded="xl"
      class="pa-2"
    >
      <template #append>
        <div class="d-flex flex-column ga-2 align-center">
          <v-btn
            :class="
              os?.status !== 'Finalizado'
                ? 'bg-red lighten-4'
                : 'bg-green lighten-4' + 'rounded-circle pa-2 me-2'
            "
            :icon="os?.status !== 'Finalizado' ? 'mdi-alert' : 'mdi-check'"
          ></v-btn>

          <span>{{ os?.status }}</span>
        </div>
      </template>
      <v-card-text>
        <h3>Descrição de Abertura</h3>
        <p>{{ os?.descricao_abertura }}</p>
        <template v-if="os?.descricao_fechamento">
          <v-divider class="my-4"></v-divider>
          <h3>Descrição de Fechamento</h3>
          <p>{{ os?.descricao_fechamento }}</p>
          <h4 class="mt-4">Tecnico fechamento</h4>
          <p>{{ os?.usuario_fechamento.name }}</p>
        </template>
      </v-card-text>
      <v-card-actions>
        <v-btn
          text="Fechar"
          variant="outlined"
          rounded="xl"
          color="red"
          @click="model = false"
          >Fechar</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
