<script setup>
import { ref } from "vue";
const emit = defineEmits(["valueChanged"]);
const props = defineProps({
  configNumber: Number,
});
const form = ref({
  vlan: null,
  vlanMode: null,
  portNumber: null,
  configType: "lan",
  configNumber: props.configNumber,
});

const inputRules = [
  (value) => {
    if (value) return true;
    return "Este campo é obrigatório";
  },
];
</script>

<template>
  <v-row>
    <v-col>
      <v-radio-group inline v-model="form.configType">
        <v-radio label="Lan Config" value="lan" color="orange"></v-radio>
        <v-radio label="veip config" value="veip" color="orange"></v-radio>
      </v-radio-group>
    </v-col>
  </v-row>
  <v-row>
    <v-col>
      <v-text-field
        type="number"
        label="vlan"
        @input="emit('valueChanged', form)"
        v-model="form.vlan"
        :rules="inputRules"
      ></v-text-field>
    </v-col>
    <v-col>
      <v-select
        :items="['Tag', 'Transparent']"
        label="vlan mode"
        v-model="form.vlanMode"
        @input="emit('valueChanged', form)"
        :disabled="form.configType === 'veip'"
      ></v-select>
    </v-col>
    <v-col>
      <v-text-field
        type="number"
        label="Número da porta"
        v-model="form.portNumber"
        @input="emit('valueChanged', form)"
        :disabled="form.configType === 'veip'"
      ></v-text-field>
    </v-col>
  </v-row>
</template>
