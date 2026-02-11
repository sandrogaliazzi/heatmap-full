<script setup>
import { ref, inject, watch, onMounted, computed } from "vue";
import moment from "moment-timezone";
import fetchApi from "@/api";
import { useNotificationStore } from "@/stores/notification";
import { useServiceStore } from "@/stores/services";

const serviceStore = useServiceStore();

const { metricId } = defineProps(["metricId"]);
const emit = defineEmits(["update-sales"]);

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

function getCurrentWeekNumber(date) {
  moment.tz.setDefault("America/Sao_Paulo");

  const momentDate = date ? moment(date) : moment();

  const weekNumber = momentDate.isoWeek();

  return weekNumber;
}

const seller = ref("");
const sellerClass = ref(null);
const clientName = ref("");
const date = ref(formatDate(new Date()));
const city = ref("");
const weekNumber = ref(getCurrentWeekNumber());
const saleCategory = ref("Venda");
const ticket = ref("");
const ticketValue = ref(null);
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

const sellersName = computed(() => sellers.value.map((seller) => seller.name));

const findClass = (name) => {
  const seller = sellers.value.find((seller) => seller.name === name);
  return seller ? seller.sellerClass : null;
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
      ticketValue: ticketValue.value,
      city: city.value,
      saleCategory: saleCategory.value,
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
        <v-radio-group inline class="mt-4" v-model="saleCategory">
          <v-radio label="venda nova" value="Venda" color="orange"></v-radio>
          <v-radio label="upgrade" value="Upgrade" color="orange"></v-radio>
          <v-radio
            label="novo ponto"
            value="Novo Ponto"
            color="orange"
          ></v-radio>
        </v-radio-group>
        <v-select
          label="Vendedor"
          :items="sellersName"
          prepend-icon="mdi-badge-account"
          v-model="seller"
          :rules="inputRules"
          variant="underlined"
        ></v-select>

        <v-text-field
          v-model="clientName"
          name="clientName"
          variant="underlined"
          prepend-icon="mdi-account-circle"
          :rules="inputRules"
          clearable
          type="text"
          label="Cliente"
        ></v-text-field>

        <v-autocomplete
          label="Selecionar Plano"
          prepend-icon="mdi-percent-circle"
          :items="serviceStore.services.map((service) => service.descricao)"
          :rules="inputRules"
          v-model="ticket"
          variant="underlined"
        ></v-autocomplete>

        <v-text-field
          type="number"
          label="Valor do Plano"
          variant="underlined"
          prepend-icon="mdi-currency-usd"
          v-model="ticketValue"
          :rules="inputRules"
        ></v-text-field>

        <v-row>
          <v-col>
            <v-text-field
              type="date"
              prepend-icon="mdi-calendar"
              label="data"
              variant="underlined"
              v-model="date"
            >
            </v-text-field>
          </v-col>
          <v-col>
            <v-select
              variant="underlined"
              prepend-icon="mdi-city"
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
