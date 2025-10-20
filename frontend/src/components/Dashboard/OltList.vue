<script setup>
import { ref, onMounted, computed } from "vue";
import fetchApi from "@/api";
import hubApi from "@/api/hubsoftApi";

const oltList = ref([]);
const query = ref("");
const panel = ref([]);

const fetchOltList = async () => {
  try {
    const response = await hubApi.get("/api/v1/integracao/rede/equipamento");
    if (response.data.status === "success") {
      return response.data.equipamentos.filter((equip) =>
        equip.nome.startsWith("OLT")
      );
    }
  } catch (error) {
    console.log("erro ao buscar equipamentos", error.message);
  }
};

const filteredOltList = computed(() => {
  return oltList.value.filter((olt) =>
    olt.nome.toLowerCase().includes(query.value.toLowerCase())
  );
});

onMounted(async () => {
  oltList.value = await fetchOltList();
  console.log("oltList", oltList.value);
});
</script>

<template>
  <v-row justify="center">
    <v-col cols="11" md="9" class="fixed-column">
      <v-form>
        <v-text-field
          variant="solo"
          label="olts"
          append-inner-icon="mdi-magnify"
          single-line
          hide-details
          v-model="query"
        >
        </v-text-field>
      </v-form>
    </v-col>
    <v-col cols="12" md="10" class="scrollable-column">
      <v-expansion-panels>
        <v-expansion-panel
          v-for="olt in filteredOltList || oltList"
          :key="olt.id_equipamento"
          :title="olt.nome"
          v-model="panel"
          multiple
        >
          <v-expansion-panel-text>
            <div class="mb-4 d-flex ga-3">
              <v-btn color="success">habilitar olt no heatmap</v-btn>
              <v-btn color="error">Desabilitar olt no heatmap</v-btn>
            </div>
            <v-list>
              <v-list-item
                v-for="oltInterface in olt.interfaces"
                :key="oltInterface.id_interface_conexao"
                :subtitle="oltInterface.descricao"
                :title="oltInterface.nome"
                :value="oltInterface.nome"
              >
              </v-list-item>
            </v-list>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-col>
  </v-row>
</template>

<style scoped>
.fixed-column {
  position: sticky;
  top: 0;
}

.scrollable-column {
  max-height: 80vh; /* Set the maximum height for the scrollable column */
  overflow-y: auto; /* Enable vertical scrolling when content exceeds the max height */
}
</style>
