<script setup>
import { ref, inject, watch } from "vue";
import moment from "moment-timezone";
import fetchApi from "@/api";
import { useNotificationStore } from "@/stores/notification";
import planosJSON from "./planos.json";

const { metricId } = defineProps(["metricId"]);
const emit = defineEmits(["update-sales"]);

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

function getCurrentWeekNumber(date) {
  // Configurando o fuso horário para Brasília
  moment.tz.setDefault("America/Sao_Paulo");

  // Obtendo a data atual no fuso horário de Brasília
  const momentDate = date ? moment(date) : moment();

  // Obtendo o número da semana atual
  const weekNumber = momentDate.isoWeek();

  return weekNumber;
}

const seller = ref("");
const planos = ref(planosJSON);
const sellerClass = ref(null);
const clientName = ref("");
const date = ref(formatDate(new Date()));
const city = ref("");
const weekNumber = ref(getCurrentWeekNumber());
const ticket = ref("");
const formRef = ref(null);
const cardLoader = ref(false);
const notification = useNotificationStore();
const closeDialog = inject("closeDialog");

const inputRules = [
  (value) => {
    if (value) return true;

    return "Este campo é obrigatório";
  },
];

const sellersName = ref([
  "FELIPE",
  "LUIS FELIPE",
  "ELVIS",
  "JANICE",
  "JESSICA",
  "EQUIPE CONECT",
  "DIEGO",
  "GIACOMO",
]);

const findClass = (name) => {
  return ["JESSICA", "NADINE", "JANICE", "EQUIPE CONECT", "GIACOMO"].indexOf(
    name
  ) > -1
    ? 0
    : 1;
};

watch(seller, (name) => {
  sellerClass.value = findClass(name);
});

watch(date, (newDate) => {
  weekNumber.value = getCurrentWeekNumber(newDate);
});

const resetForm = () => {
  seller.value = "";
  clientName.value = "";
  ticket.value = "";
  date.value = formatDate(new Date());
  cardLoader.value = false;
};

const handleSubmit = async () => {
  const { valid } = await formRef.value.validate();

  if (valid) {
    const requestBody = {
      date: date.value,
      weekNumber: weekNumber.value,
      seller: seller.value,
      sellerClass: sellerClass.value,
      client: clientName.value.toUpperCase(),
      ticket: ticket.value,
      city: city.value,
      metricId,
    };

    try {
      cardLoader.value = true;
      const response = await fetchApi.post("/addSale", requestBody);

      if (response.status == 200) {
        notification.setNotification({
          msg: "Venda cadastrada com sucesso",
          status: "success",
        });
        resetForm();
        emit("update-sales");
      }
    } catch (error) {
      notification.setNotification({
        msg: "Erro ao cadastrar venda",
        status: "error",
      });
    }
  }
};
</script>

<template>
  <v-card :loading="cardLoader">
    <template v-slot:loader="{ isActive }">
      <v-progress-linear
        :active="isActive"
        color="orange"
        height="4"
        indeterminate
      ></v-progress-linear>
    </template>
    <v-card-title class="bg-orange">
      <div class="d-flex justify-space-between align-center">
        <div class="d-flex">
          <p class="me-2">Adicionar Venda</p>
          <v-icon>mdi-handshake</v-icon>
        </div>
        <v-btn variant="text" icon="mdi-close" @click="closeDialog"></v-btn>
      </div>
    </v-card-title>
    <v-card-text>
      <v-form
        @submit.prevent="handleSubmit"
        ref="formRef"
        class="mb-3"
        id="saleForm"
      >
        <v-select
          label="Vendedor"
          :items="sellersName"
          v-model="seller"
          :rules="inputRules"
        ></v-select>

        <v-text-field
          v-model="clientName"
          name="clientName"
          :rules="inputRules"
          clearable
          type="text"
          label="Cliente"
        ></v-text-field>
        <v-row>
          <v-col>
            <v-autocomplete
              label="Selecionar Plano"
              :items="planos.map((p) => p['Nome do Plano'])"
              :rules="inputRules"
              v-model="ticket"
            ></v-autocomplete>
          </v-col>
        </v-row>
        <v-row>
          <v-col>
            <v-text-field type="date" label="data" v-model="date">
            </v-text-field>
          </v-col>
          <v-col>
            <v-select
              label="Cidade"
              :items="[
                'NOVA HARTZ',
                'IGREJINHA',
                'ARARICA',
                'TAQUARA',
                'GRAVATAI',
                'PAROBÉ',
                'GLORINHA',
                'NOVO HAMBURGO',
                'SAPIRANGA',
                'TRÊS COROAS',
              ]"
              :rules="inputRules"
              v-model="city"
            ></v-select>
          </v-col>
        </v-row>

        <br />

        <v-btn
          block
          color="success"
          size="large"
          type="submit"
          variant="elevated"
          @keyup.enter="handleSubmit"
          :disabled="cardLoader"
        >
          Enviar
        </v-btn>
      </v-form>
    </v-card-text>
  </v-card>
</template>
