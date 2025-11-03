<script setup>
import { ref, watch } from "vue";
import moment from "moment-timezone";
import fetchApi from "@/api";
import { useNotificationStore } from "@/stores/notification";
import planosJSON from "./planos.json";

const { sale } = defineProps(["sale"]);
const emit = defineEmits(["close-form"]);

function getCurrentWeekNumber(date) {
  // Configurando o fuso horário para Brasília
  moment.tz.setDefault("America/Sao_Paulo");

  // Obtendo a data atual no fuso horário de Brasília
  const momentDate = date ? moment(date) : moment();

  // Obtendo o número da semana atual
  const weekNumber = momentDate.isoWeek();

  return weekNumber;
}

const findClass = (name) => {
  return ["JESSICA", "NADINE", "JANICE", "EQUIPE CONECT"].indexOf(name) > -1
    ? 0
    : 1;
};

const seller = ref(sale.seller);
const planos = ref(planosJSON);
const sellerClass = ref(findClass(sale.seller));
const date = ref(sale.date);
const city = ref(sale.city || "");
const weekNumber = ref(getCurrentWeekNumber(sale.date));
const formRef = ref(null);
const cardLoader = ref(false);
const ticket = ref(sale.ticket);
const clientName = ref(sale.client);
const notification = useNotificationStore();

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
  "NADINE",
  "JANICE",
  "JESSICA",
  "GIACOMO",
  "DOUGLAS",
  "DIEGO",
  "EQUIPE CONECT",
]);

watch(seller, (name) => {
  sellerClass.value = findClass(name);
});

watch(date, (newDate) => {
  weekNumber.value = getCurrentWeekNumber(newDate);
});

const handleSubmit = async () => {
  const { valid } = await formRef.value.validate();

  if (valid) {
    const requestBody = {
      _id: sale._id,
      date: date.value,
      weekNumber: weekNumber.value,
      seller: seller.value,
      sellerClass: sellerClass.value,
      client: clientName.value.toUpperCase(),
      ticket: ticket.value,
      city: city.value,
      metricId: sale.metricId,
    };

    try {
      cardLoader.value = true;
      const response = await fetchApi.post("/addSale", requestBody);

      if (response.status == 200) {
        notification.setNotification({
          msg: "Venda cadastrada com sucesso",
          status: "success",
        });
        emit("close-form");
        console.log(response.data);
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
        <v-text-field type="date" label="data" v-model="date"> </v-text-field>
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
</template>
