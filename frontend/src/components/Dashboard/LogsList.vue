<script setup>
import fetchApi from "@/api";
import { ref, onMounted, computed, watch } from "vue";

const logs = ref([]);
const query = ref("");
const date = ref(new Date().toLocaleDateString("pt-BR"));
const loading = ref(true);

const fetchLogs = async () => {
  const response = await fetchApi("logctoclient");

  logs.value = response.data.map((log) => {
    const [_, month, year] = log.date_time.split(",")[0].split("/");
    return {
      ...log,
      splitDate: {
        month,
        year,
      },
    };
  });

  loading.value = false;
};

onMounted(async () => {
  await fetchLogs();
  //await logsListByCity();
});

const filterLogsByNameAndDate = computed(() => {
  if (!date.value) {
    return logs.value.filter((log) =>
      log.name.includes(query.value.toUpperCase())
    );
  }

  return logs.value.filter(
    (log) =>
      log.name.includes(query.value.toUpperCase()) &&
      log.date_time.split(",")[0] == date.value
  );
});

watch(date, () => {
  const newFormatedDate = date.value.split("-").reverse().join("/");
  date.value = newFormatedDate;
});
</script>

<template>
  <v-row justify="center">
    <v-col cols="12" md="8" class="fixed-column">
      <v-form>
        <v-text-field
          variant="solo"
          label="Pesquisar por nome"
          append-inner-icon="mdi-magnify"
          single-line
          hide-details
          color="orange"
          :loading="loading"
          v-model="query"
        >
        </v-text-field>
      </v-form>
    </v-col>
    <v-col cols="12" md="2">
      <v-text-field
        variant="solo"
        type="date"
        label="selecionar data"
        v-model="date"
      ></v-text-field>
    </v-col>
  </v-row>
  <v-row no-gutters justify="center">
    <v-col cols="12" md="10">
      <v-chip
        prepend-icon="mdi-calendar-range"
        closable
        v-if="date"
        @click:close="date = ''"
      >
        Ativações em {{ date }}
      </v-chip>
    </v-col>
  </v-row>
  <v-row justify="center">
    <v-col cols="12" md="10" class="scrollable-column">
      <v-list nav lines="three">
        <div v-if="query && !filterLogsByNameAndDate.length">
          <v-list-item>
            <div
              class="d-flex justify-center align-center text-center"
              style="min-height: 500px"
            >
              <div>
                <v-icon size="200px"> mdi-account-search </v-icon>
                <p class="text-center text-h5">
                  Nenhum resultado correspondente a {{ query }}
                </p>
              </div>
            </div>
          </v-list-item>
        </div>
        <div v-else>
          <v-virtual-scroll :items="filterLogsByNameAndDate || logs">
            <template v-slot:default="{ item }">
              <v-list-item
                :title="item.name.toUpperCase()"
                :value="item.name"
                prepend-icon="mdi-web"
              >
                <v-list-item-subtitle class="mt-2">
                  <p>{{ item.date_time }}</p>
                  <p class="d-block d-sm-none">
                    {{ item.user }} <b>CTO: {{ item.cto_name }}</b>
                  </p>
                </v-list-item-subtitle>
                <template #append>
                  <div class="d-none d-sm-flex">
                    <v-chip
                      class="mr-2"
                      prepend-icon="mdi-tools"
                      :color="item.user == 'DOUGLAS' ? 'green' : 'primary'"
                    >
                      {{ item.user }}
                    </v-chip>
                    <v-chip prepend-icon="mdi-cube">
                      {{ item.cto_name }}
                    </v-chip>
                  </div>
                </template>
              </v-list-item>
            </template>
          </v-virtual-scroll>
        </div>
      </v-list>
    </v-col>
  </v-row>
</template>

<style scoped>
.fixed-column {
  position: sticky;
  top: 0;
}

.scrollable-column {
  max-height: 70vh; /* Set the maximum height for the scrollable column */
  overflow-y: auto; /* Enable vertical scrolling when content exceeds the max height */
}
</style>
