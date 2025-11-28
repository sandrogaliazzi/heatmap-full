<script setup>
import { ref, watch, onMounted } from "vue";
import fetchApi from "@/api";
import Dialog from "@/components/Dialog/Dialog.vue";
import SaleForm from "./SaleForm.vue";

const { metrics, metric } = defineProps(["metrics", "metric"]);
const emit = defineEmits([
  "update-metric",
  "update-component",
  "update-sale",
  "update-view-number",
]);

const openForm = ref(false);
const openDialog = ref(false);
const newMetric = ref({ ...metric });
const createNewMetric = ref(false);
const viewSettings = ref(false);
const viewNumber = ref(1);
const play = ref(true);

const showAllMetricsOnMenu = ref(false);

const metricSlice = ref(metrics.slice(-5));

watch(showAllMetricsOnMenu, () => {
  if (showAllMetricsOnMenu.value) {
    metricSlice.value = metrics;
  } else {
    metricSlice.value = metrics.slice(-5);
  }
});

const resetState = () => {
  newMetric.value = { ...newMetric };
  openForm.value = false;
  createNewMetric.value = false;
};

let interval;

const playView = () => {
  if (play.value) {
    interval = setInterval(() => {
      emit("update-view-number", viewNumber.value++);
    }, 15000);
  }
};

watch(play, (isPlaying) => {
  if (isPlaying) {
    playView();
  } else {
    clearInterval(interval);
  }
});

watch(viewNumber, (currentNumber) => {
  if (currentNumber > 3) viewNumber.value = 1;
  if (currentNumber < 1) viewNumber.value = 3;
  emit("update-view-number", viewNumber.value);
});

watch(createNewMetric, (newVal) => {
  if (newVal) newMetric.value = {};
  else newMetric.value = { ...metric };
});

onMounted(() => {
  playView();
});

const submitMetric = async () => {
  if (confirm("Confirmar edição de métrica")) {
    let response;
    if (!createNewMetric.value) {
      response = await fetchApi.post("/goals", { ...newMetric.value });
    } else {
      response = await fetchApi.post("/goals", {
        description: newMetric.value.description,
        monthSales: newMetric.value.monthSales,
        weekSales: newMetric.value.weekSales,
        dailySales: newMetric.value.dailySales,
        phrase: newMetric.value.phrase,
        date: new Date().toLocaleDateString(),
      });
    }
    if (response.status === 200) {
      alert("Métrica atualizada com sucesso");
      emit("update-component");
      resetState();
    } else {
      alert("Erro ao atualizar a métrica");
    }
  }
};
</script>

<template>
  <Dialog :isOpen="openDialog" @update:modalValue="openDialog = false">
    <SaleForm
      :metricId="metric._id"
      @update-sales="() => emit('update-sale')"
    />
  </Dialog>
  <v-card class="py-3 mx-3 rounded-t-xl" variant="flat">
    <v-divider></v-divider>
    <v-card-title
      class="d-flex flex-column justify-center text-wrap align-center ga-3"
    >
      <span
        class="px-4 mb-4 text-capitalize text-button"
        style="font-size: 1.5rem !important"
        >METAS {{ metric.description }}</span
      >

      <div class="d-flex ga-6 mb-3 rounded-pill pa-3 elevation-2">
        <v-btn
          icon="mdi-chart-line"
          color="orange"
          variant="tonal"
          @click="openForm = !openForm"
        ></v-btn>
        <v-btn
          icon="mdi-menu"
          color="primary"
          variant="tonal"
          id="menu-activator"
        >
        </v-btn>

        <v-btn
          icon="mdi-eye-settings"
          color="indigo"
          variant="tonal"
          @click="viewSettings = !viewSettings"
        >
        </v-btn>

        <v-menu activator="#menu-activator">
          <v-list>
            <v-list-item
              v-for="metric in metricSlice"
              :key="metric._id"
              :value="metric.description"
              @click="$emit('update-metric', metric)"
            >
              <v-list-item-title>{{ metric.description }}</v-list-item-title>
            </v-list-item>
            <v-list-item
              v-if="!showAllMetricsOnMenu"
              value="Mostrar mais..."
              title="Mostrar mais..."
              @click.stop="showAllMetricsOnMenu = true"
            >
            </v-list-item>
            <v-list-item
              v-else
              title="Mostrar menos..."
              value="Mostrar menos..."
              @click.stop="showAllMetricsOnMenu = false"
            >
            </v-list-item>
          </v-list>
        </v-menu>
        <v-btn
          icon="mdi-plus"
          color="green"
          variant="tonal"
          @click="openDialog = true"
        ></v-btn>
      </div>
      <div class="d-flex" v-if="viewSettings">
        <v-btn
          icon="mdi-rewind"
          variant="text"
          color="white"
          @click="viewNumber--"
        ></v-btn>
        <v-btn
          :icon="play ? 'mdi-pause' : 'mdi-play'"
          variant="text"
          color="white"
          @click="play = !play"
        ></v-btn>
        <v-btn
          icon="mdi-fast-forward"
          variant="text"
          color="white"
          @click="viewNumber++"
        ></v-btn>
      </div>
    </v-card-title>
    <template v-if="openForm">
      <v-card-text class="mt-4">
        <v-row>
          <v-col cols="12" md="6">
            <v-text-field
              type="text"
              variant="underlined"
              label="Descrição"
              prepend-icon="mdi-text"
              v-model="newMetric.description"
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="2">
            <v-text-field
              type="number"
              variant="underlined"
              label="Mês"
              prepend-icon="mdi-calendar-month"
              v-model="newMetric.monthSales"
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="2">
            <v-text-field
              type="number"
              variant="underlined"
              label="Semana"
              prepend-icon="mdi-calendar-week"
              v-model="newMetric.weekSales"
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="2">
            <v-text-field
              type="number"
              variant="underlined"
              label="Dia"
              prepend-icon="mdi-calendar-today"
              v-model="newMetric.dailySales"
            ></v-text-field>
          </v-col>
          <v-col cols="12">
            <v-textarea
              clearable
              label="Frase"
              variant="underlined"
              prepend-icon="mdi-format-quote-close"
              v-model="newMetric.phrase"
            ></v-textarea>
          </v-col>
        </v-row>
        <v-checkbox label="Nova métrica" v-model="createNewMetric"></v-checkbox>
      </v-card-text>
      <v-card-actions>
        <v-btn
          color="success"
          variant="tonal"
          prepend-icon="mdi-check"
          rounded="xl"
          @click="submitMetric"
          >Registrar</v-btn
        >
        <v-btn
          variant="tonal"
          prepend-icon="mdi-close"
          rounded="xl"
          @click="resetState"
          >cancelar</v-btn
        >
      </v-card-actions>
    </template>
  </v-card>
</template>
