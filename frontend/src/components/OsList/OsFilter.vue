<script setup>
import { ref, computed, watch } from "vue";
import { useOsStore } from "@/stores/osStore";

const osStore = useOsStore();

const formatDate = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formattedDateRange = computed(() => {
  if (dateRange.value.length === 0) return [];

  const startDate = formatDate(dateRange.value[0]);
  const endDate =
    dateRange.value.length > 1 ? formatDate(dateRange.value[1]) : startDate;

  return [startDate, endDate];
});

const dateRange = ref([]);

watch(dateRange, () => {
  if (dateRange.value.length === 0) {
    osStore.dateRange = [
      new Date().toISOString().split("T")[0],
      new Date().toISOString().split("T")[0],
    ];
  } else {
    osStore.dateRange = formattedDateRange.value;
  }
});
</script>
<template>
  <v-card class="px-2 mx-auto" rounded="lg" variant="flat">
    <v-card-title>
      <v-btn prepend-icon="mdi-filter">
        Filtrar por status e data
        <v-menu activator="parent">
          <v-list>
            <v-list-item>
              <v-radio-group v-model="osStore.status">
                <v-radio
                  v-for="(status, index) in osStore.statusList"
                  :key="index"
                  :label="status"
                  :value="status"
                  @click.stop="return"
                ></v-radio>
              </v-radio-group>
            </v-list-item>
            <v-list-item>
              <v-date-input
                label="selecionar período"
                prepend-icon=""
                v-model="dateRange"
                multiple="range"
                clearable
                prepend-inner-icon="$calendar"
                variant="solo"
              ></v-date-input>
            </v-list-item>
          </v-list>
        </v-menu>
      </v-btn>
    </v-card-title>
  </v-card>
</template>
