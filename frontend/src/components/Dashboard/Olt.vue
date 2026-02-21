<script setup>
import { ref } from "vue";
const { olt } = defineProps(["olt"]);

const newOlt = ref({
    name: olt.name,
    ip: olt.ip,
    vendor: olt.vendor || "N/A",
    citys: olt.citys || "N/A",
    interfaces: olt.interfaces || "N/A",
});

const areas = ref([
    "ARARICA", "IGREJINHA", "NOVA HARTZ", "M. PEDRA", "FAZ. FIALHO", "PAROBE", "TRES COROAS", "SÃO JOÃO DO DESERTO", "MORUNGAVA", "SAPIRANGA",
]);
const
</script>

<template>
  <v-card>
    <v-card-text>
      <v-form>
        <v-row>
          <v-col>
            <v-text-field
              label="Nome"
              v-model="newOlt.name"
              disabled
            ></v-text-field>
          </v-col>
          <v-col>
            <v-text-field
              label="IP"
              v-model="newOlt.ip"
              disabled
            ></v-text-field>
          </v-col>
          <v-col>
            <v-text-field
              label="vendor"
              v-model="newOlt.vendor"
              disabled
            ></v-text-field>
          </v-col>
        </v-row>
        <v-row>
          <v-col>
            <v-select
              label="areas"
              :items="areas"
              chips
              multiple
              v-model="newOlt.citys"
              disabled
            ></v-select>
          </v-col>
        </v-row>
      </v-form>
    </v-card-text>
  </v-card>
</template>
