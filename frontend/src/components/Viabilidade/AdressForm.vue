<script setup>
import { ref } from "vue";

// Estado de validação
const valid = ref(false);
const form = ref(null);
const emit = defineEmits(["submitAdress", "closeDialog"]);

// Dados do endereço
const endereco = ref({
  cep: "",
  rua: "",
  numero: "",
  bairro: "",
  cidade: "",
  estado: "",
});

const range = ref(300);

// Regras de validação
const rules = {
  required: (v) => !!v || "Campo obrigatório",
  cep: (v) => /^\d{8}$|^\d{5}-\d{3}$/.test(v) || "CEP inválido",
};

const obterCoordenadas = async (endereco) => {
  return new Promise((resolve, reject) => {
    if (!google || !google.maps) {
      reject(new Error("Google Maps API não carregada"));
      return;
    }

    const geocoder = new google.maps.Geocoder();

    // Monta o endereço em uma string
    const enderecoCompleto = `
      ${endereco.rua} ${endereco.numero},
      ${endereco.bairro},
      ${endereco.cidade} - ${endereco.estado},
      ${endereco.cep}
    `.trim();

    geocoder.geocode({ address: enderecoCompleto }, (results, status) => {
      if (status === "OK" && results[0]) {
        const location = results[0].geometry.location;
        resolve({
          latitude: location.lat(),
          longitude: location.lng(),
        });
      } else {
        reject(new Error(`Geocoding falhou: ${status}`));
      }
    });
  });
};

const getAddressFromCep = async (cep) => {
  if (!cep) return;
  cep = cep.replace("-", "");
  try {
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    if (!response.ok) throw new Error("Erro ao buscar CEP");
    const adressData = await response.json();
    if (!adressData || adressData.erro) return;
    endereco.value = {
      rua: adressData.logradouro || "",
      bairro: adressData.bairro || "",
      cidade: adressData.localidade || "",
      estado: adressData.uf || "",
      cep: adressData.cep || "",
      numero: "", // Número deve ser preenchido manualmente
    };
  } catch (error) {
    console.error("Erro ao obter endereço:", error);
    return null;
  }
};

const submit = async () => {
  const { valid } = await form.value.validate();
  if (valid) {
    const coordenadas = await obterCoordenadas(endereco.value);
    emit("submitAdress", { ...coordenadas, range: range.value });
  }
};
</script>
<template>
  <VCard>
    <v-toolbar color="orange" title="Endereço">
      <v-toolbar-items>
        <v-btn icon="mdi-close" @click="emit('closeDialog')"></v-btn>
      </v-toolbar-items>
    </v-toolbar>

    <VCardText>
      <VForm ref="form" v-model="valid">
        <VTextField
          v-model="endereco.cep"
          label="CEP"
          :rules="[rules.required, rules.cep]"
          variant="underlined"
          maxlength="9"
          placeholder="00000-000"
          @change="getAddressFromCep(endereco.cep)"
        />

        <VTextField
          v-model="endereco.rua"
          label="Rua"
          :rules="[rules.required]"
          variant="underlined"
        />

        <VTextField
          v-model="endereco.numero"
          label="Número"
          :rules="[rules.required]"
          variant="underlined"
        />

        <VTextField
          v-model="endereco.bairro"
          label="Bairro"
          :rules="[rules.required]"
          variant="underlined"
        />

        <VTextField
          v-model="endereco.cidade"
          label="Cidade"
          :rules="[rules.required]"
          variant="underlined"
        />
        <VTextField
          v-model="range"
          label="Raio (em metros)"
          :rules="[rules.required]"
          variant="underlined"
        />
      </VForm>
    </VCardText>

    <VCardActions>
      <VBtn color="success" variant="flat" @click="submit" block>
        Confirmar
      </VBtn>
    </VCardActions>
  </VCard>
</template>
