<script setup>
import { ref, onMounted, computed } from "vue";
import fetchApi from "@/api";
import hubApi from "@/api/hubsoftApi";
import { useNotificationStore } from "@/stores/notification";

const oltList = ref([]);
const query = ref("");
const panel = ref([]);
const syncWithHubLoading = ref(false);
const notification = useNotificationStore();

const fetchOltList = async () => {
  try {
    const response = await hubApi.get("/api/v1/integracao/rede/equipamento");
    if (response.data.status === "success") {
      return response.data.equipamentos.filter((equip) =>
        equip.nome.startsWith("OLT"),
      );
    }
  } catch (error) {
    console.log("erro ao buscar equipamentos", error.message);
  }
};

const heatmapOlts = ref([]);

const getHeatmapOltList = async () => {
  try {
    const response = await fetchApi.get("listar-olt");
    heatmapOlts.value = response.data;
  } catch (error) {
    console.log("erro ao buscar equipamentos", error.message);
  }
};

const oltPop = (oltName) => {
  return oltName.split(" ").slice(3).join(" ");
};

const addOlt = async (olt) => {
  try {
    await fetchApi.post("/add-olt", {
      oltIp: olt.ipv4,
      ipv4: olt.ipv4,
      hubsoft_id: olt.id_equipamento,
      oltName: olt.nome,
      oltPop: oltPop(olt.nome),
      active: false,
    });
  } catch (error) {
    console.log("erro ao adicionar olt", error.message);
  }
};

const matchOlt = (olt) => {
  return heatmapOlts.value.find(
    (holt) => holt.hubsoft_id == olt.id_equipamento,
  );
};

const syncWithHub = async () => {
  syncWithHubLoading.value = true;
  try {
    oltList.value = await fetchOltList();
    const oltsNotSync = oltList.value.filter(
      (olt) =>
        !heatmapOlts.value.find(
          (holt) => holt.hubsoft_id == olt.id_equipamento,
        ),
    );

    if (oltsNotSync.length === 0) {
      notification.setNotification({
        status: "success",
        msg: "Todos os olts ja foram sincronizadas",
      });
      syncWithHubLoading.value = false;
      return;
    }

    await Promise.all(oltsNotSync.map((olt) => addOlt(olt)));
    notification.setNotification({
      status: "success",
      msg: oltsNotSync.length + " Olts sincronizados com sucesso",
    });

    await getHeatmapOltList();

    syncWithHubLoading.value = false;
  } catch (error) {
    console.log("erro ao sincronizar olts", error.message);
    notification.setNotification({
      status: "error",
      msg: "Erro ao sincronizar olts",
    });
    syncWithHubLoading.value = false;
  } finally {
    syncWithHubLoading.value = false;
  }
};

const filteredOltList = computed(() => {
  return oltList.value.filter((olt) =>
    olt.nome.toLowerCase().includes(query.value.toLowerCase()),
  );
});

const changeOltActiveStatus = async (status, olt) => {
  try {
    const response = await fetchApi.post("/editar-status-olt", {
      id: olt.id_equipamento,
      status,
    });
    if (response.status === 200) {
      notification.setNotification({
        status: "success",
        msg: "Status alterado com sucesso",
      });
      heatmapOlts.value.find(
        (holt) => holt.hubsoft_id == olt.id_equipamento,
      ).active = status;
      getHeatmapOltList();
    }
  } catch (error) {
    console.log("erro ao alterar status", error.message);
    notification.setNotification({
      status: "error",
      msg: "Erro ao alterar status",
    });
  }
};

onMounted(async () => {
  await getHeatmapOltList();
  oltList.value = await fetchOltList();
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
      <v-btn
        color="primary"
        class="mt-2"
        block
        variant="text"
        @click="syncWithHub"
        :loading="syncWithHubLoading"
        >sincronizar com hub</v-btn
      >
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
            <v-switch
              :model-value="matchOlt(olt)?.active"
              color="primary"
              label="ativo no heatmap"
              @update:model-value="changeOltActiveStatus($event, olt)"
            ></v-switch>
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
