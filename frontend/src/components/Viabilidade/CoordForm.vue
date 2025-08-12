<script setup>
import { ref } from "vue";
const emit = defineEmits(["submitCoords"]);

const range = ref(300);
const latitude = ref();
const longitude = ref();

const valid = ref(false);
const form = ref(null);

const rules = {
  required: (v) => !!v || "Campo obrigatório",
  cep: (v) => /^\d{5}-\d{3}$/.test(v) || "CEP inválido",
};

const submit = async () => {
  const { valid } = await form.value.validate();
  if (valid) {
    emit("submitCoords", {
      latitude: +latitude.value,
      longitude: +longitude.value,
      range: range.value,
    });
  }
};
</script>

<template>
  <v-card title="Coordenadas">
    <v-card-text>
      <v-form ref="form" v-model="valid" @submit.prevent="submit">
        <v-text-field
          type="number"
          label="latitude"
          variant="outlined"
          v-model="latitude"
          :rules="[rules.required]"
        ></v-text-field>
        <v-text-field
          type="number"
          label="longitude"
          variant="outlined"
          v-model="longitude"
          :rules="[rules.required]"
        ></v-text-field>
        <v-text-field
          type="number"
          label="Raio"
          variant="outlined"
          v-model="range"
        ></v-text-field>
        <v-btn type="submit">confirmar</v-btn>
      </v-form>
    </v-card-text>
  </v-card>
</template>
