<script setup>
import { ref, watch, onMounted, computed } from "vue";
import moment from "moment-timezone";
import fetchApi from "@/api";
import { useNotificationStore } from "@/stores/notification";
import planosJSON from "./planos.json";

const { sale } = defineProps(["sale"]);
const emit = defineEmits(["close-form"]);

function getCurrentWeekNumber(date) {
  moment.tz.setDefault("America/Sao_Paulo");

  const momentDate = date ? moment(date) : moment();

  const weekNumber = momentDate.isoWeek();

  return weekNumber;
}

const sellers = ref([]);

const loadSellers = async () => {
  const response = await fetchApi.get("/users");
  return response.data
    .filter((user) => user.category === "vendas" || user.name == "felipe")
    .map((user) => ({ ...user, name: user.name.toUpperCase() }));
};

onMounted(async () => {
  sellers.value = await loadSellers();
});

const findSellerClass = (sellerName) => {
  const seller = sellers.value.find((seller) => seller.name === sellerName);
  return seller ? seller.sellerClass : null;
};

const seller = ref(sale.seller);
const planos = ref(planosJSON);
const sellerClass = ref(findSellerClass(sale.seller));
const date = ref(sale.date);
const city = ref(sale.city || "");
const weekNumber = ref(getCurrentWeekNumber(sale.date));
const formRef = ref(null);
const cardLoader = ref(false);
const ticket = ref(sale.ticket);
const ticketValue = ref(sale.ticketValue || null);
const clientName = ref(sale.client);
const saleCategory = ref(sale.saleCategory || "Venda");
const notification = useNotificationStore();

const inputRules = [
  (value) => {
    if (value) return true;

    return "Este campo é obrigatório";
  },
];

const sellersName = computed(() => sellers.value.map((seller) => seller.name));
watch(seller, () => {
  sellerClass.value = findSellerClass(seller.value);
  console.log("seller class", sellerClass.value);
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
      ticketValue: ticketValue.value,
      city: city.value,
      metricId: sale.metricId,
      saleCategory: saleCategory.value,
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
    <v-radio-group inline class="mt-4" v-model="saleCategory">
      <v-radio label="venda nova" value="Venda" color="orange"></v-radio>
      <v-radio label="upgrade" value="Upgrade" color="orange"></v-radio>
      <v-radio label="novo ponto" value="Novo Ponto" color="orange"></v-radio>
    </v-radio-group>
    <v-select
      label="Vendedor"
      :items="sellersName"
      v-model="seller"
      :rules="inputRules"
      variant="underlined"
      prepend-icon="mdi-badge-account"
    ></v-select>

    <v-text-field
      v-model="clientName"
      name="clientName"
      :rules="inputRules"
      clearable
      type="text"
      label="Cliente"
      prepend-icon="mdi-account-circle"
      variant="underlined"
    ></v-text-field>
    <v-row>
      <v-col cols="12">
        <v-autocomplete
          label="Selecionar Plano"
          :items="planos.map((p) => p['Nome do Plano'])"
          :rules="inputRules"
          v-model="ticket"
          variant="underlined"
          prepend-icon="mdi-percent-circle"
        ></v-autocomplete>
      </v-col>
      <v-col cols="12">
        <v-text-field
          type="number"
          label="Valor do Plano"
          v-model="ticketValue"
          :rules="inputRules"
          variant="underlined"
          prepend-icon="mdi-currency-usd"
        ></v-text-field>
      </v-col>
    </v-row>
    <v-row>
      <v-col>
        <v-text-field
          type="date"
          label="data"
          variant="underlined"
          prepend-icon="mdi-calendar"
          v-model="date"
        >
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
            'SAPIRANGA',
            'NOVO HAMBURGO',
          ]"
          :rules="inputRules"
          v-model="city"
          variant="underlined"
          prepend-icon="mdi-city"
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
