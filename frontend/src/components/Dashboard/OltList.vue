<script setup>
import { ref, onMounted, computed } from "vue";
import fetchApi from "@/api";
import hubApi from "@/api/hubsoftApi";
import { useNotificationStore } from "@/stores/notification";
import { getApiErrorMessage } from "@/utils/apiError";
import Olt from "./Olt.vue";

const oltList = ref([]);
const query = ref("");
const panel = ref([]);
const enableForm = ref(false);
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
    throw new Error("Resposta invalida ao carregar equipamentos.");
  } catch (error) {
    const message = getApiErrorMessage(
      error,
      "Nao foi possivel carregar os equipamentos do Hubsoft.",
    );
    notification.setNotification({
      status: "error",
      msg: message,
    });
    return [];
  }
};

const heatmapOlts = ref([]);

const getHeatmapOltList = async () => {
  try {
    const response = await fetchApi.get("listar-olt");
    heatmapOlts.value = response.data;
  } catch (error) {
    notification.setNotification({
      status: "error",
      msg: getApiErrorMessage(error, "Nao foi possivel carregar as OLTs."),
    });
    heatmapOlts.value = [];
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
      active: true,
      interfaces: olt.interfaces,
    });
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, `Nao foi possivel adicionar a OLT ${olt.nome}.`),
    );
  }
};

const updateOlt = async (olt) => {
  try {
    await fetchApi.put("/update-olt", {
      oltIp: olt.ipv4,
      ipv4: olt.ipv4,
      hubsoft_id: olt.id_equipamento,
      oltName: olt.nome,
      oltPop: oltPop(olt.nome),
      active: true,
      interfaces: olt.interfaces,
    });
  } catch (error) {
    throw new Error(
      getApiErrorMessage(
        error,
        `Nao foi possivel atualizar a OLT ${olt.nome}.`,
      ),
    );
  }
};

const syncWithHub = async () => {
  syncWithHubLoading.value = true;
  try {
    oltList.value = await fetchOltList();

    await Promise.all(oltList.value.map((olt) => updateOlt(olt)));

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
    notification.setNotification({
      status: "error",
      msg: getApiErrorMessage(error, "Nao foi possivel sincronizar as OLTs."),
    });
    syncWithHubLoading.value = false;
  } finally {
    syncWithHubLoading.value = false;
  }
};

const filteredOltList = computed(() => {
  if (!query.value) return heatmapOlts.value;
  return heatmapOlts.value.filter((olt) =>
    olt.oltName.toLowerCase().includes(query.value.toLowerCase()),
  );
});

const changeOltActiveStatus = async (status, olt) => {
  try {
    const response = await fetchApi.post("/editar-status-olt", {
      id: olt.hubsoft_id,
      status,
    });
    if (response.status === 200) {
      notification.setNotification({
        status: "success",
        msg: "Status alterado com sucesso",
      });
      getHeatmapOltList();
    }
  } catch (error) {
    notification.setNotification({
      status: "error",
      msg: getApiErrorMessage(
        error,
        "Nao foi possivel alterar o status da OLT.",
      ),
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
          v-for="olt in filteredOltList || heatmapOlts"
          :key="olt.oltIp"
          :title="olt.oltName"
          v-model="panel"
          multiple
        >
          <v-expansion-panel-text>
            <div class="d-flex justify-space-between align-center">
              <v-switch
                :model-value="olt.active"
                color="primary"
                label="ativo no heatmap"
                @update:model-value="changeOltActiveStatus($event, olt)"
              ></v-switch>
              <v-switch
                :model-value="enableForm"
                color="primary"
                label="habilitar edição"
                @update:model-value="enableForm = $event"
              ></v-switch>
            </div>
            <Olt
              :olt="olt"
              :enableForm="enableForm"
              @refreshOltList="
                getHeatmapOltList;
                enableForm = false;
              "
            />
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
