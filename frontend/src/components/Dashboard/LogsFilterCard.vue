<script setup>
import { ref, computed } from "vue";

const emit = defineEmits([
  "update:closeDialog",
  "update:setFilterDate",
  "update:clearFilterDate",
]);

const months = ref([
  { name: "Janeiro", number: "01" },
  { name: "Fevereiro", number: "02" },
  { name: "Março", number: "03" },
  { name: "Abril", number: "04" },
  { name: "Maio", number: "05" },
  { name: "Junho", number: "06" },
  { name: "Julho", number: "07" },
  { name: "Agosto", number: "08" },
  { name: "Setembro", number: "09" },
  { name: "Outubro", number: "10" },
  { name: "Novembro", number: "11" },
  { name: "Dezembro", number: "12" },
]);

const getCurrentMonthNumber = () => {
  const currentMonthNumber = new Date().getMonth() + 1;

  if (currentMonthNumber < 10) return "0" + currentMonthNumber;

  return currentMonthNumber + "";
};

const selectedMonth = ref(getCurrentMonthNumber());
const selectedYear = ref("2023");

const selectedDate = computed(() => {
  return selectedMonth.value + "/" + selectedYear.value;
});
</script>
<template>
  <v-card>
    <v-card-title>
      <p>Filtrar por Ativações em: {{ selectedDate }}</p>
    </v-card-title>
    <v-card-text>
      <v-radio-group inline v-model="selectedMonth">
        <v-radio
          v-for="month in months"
          :key="month.name"
          :label="month.name"
          :value="month.number"
          color="orange"
        ></v-radio>
      </v-radio-group>
    </v-card-text>
    <v-card-actions>
      <v-btn
        color="orange"
        @click="
          emit('update:setFilterDate', {
            month: selectedMonth,
            year: selectedYear,
          })
        "
      >
        aplicar</v-btn
      >
      <v-btn color="secondary" @click="emit('update:clearFilterDate')"
        >Limpar filtro</v-btn
      >
      <v-btn color="error" @click="emit('update:closeDialog', false)"
        >Fechar</v-btn
      >
    </v-card-actions>
  </v-card>
</template>
