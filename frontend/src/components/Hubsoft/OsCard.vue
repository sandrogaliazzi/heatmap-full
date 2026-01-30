<script setup>
import { ref, onMounted, watch } from "vue";
import hubApi from "@/api/hubsoftApi";

const hubsoftData = defineModel();

const ordensServico = ref([]);
const page = ref(1);
const itemsPerPage = 3;

const chunkedOs = ref([]);

const sliceInChunks = (arr, chunkSize) => {
  return arr.reduce((prev, curr, index, arr) => {
    const chunkIndex = Math.floor(index / chunkSize);

    if (!prev[chunkIndex]) {
      prev[chunkIndex] = []; // start a new chunk
    }

    prev[chunkIndex].push(curr);

    return prev;
  }, []);
};

const getOrdensServico = async () => {
  try {
    const idClientList = hubsoftData.value.map(
      (client) => client.codigo_cliente,
    );

    const PromiseList = idClientList.map(async (id) => {
      const response = await hubApi.get(
        `/api/v1/integracao/cliente/ordem_servico?busca=codigo_cliente&termo_busca=${id}&order_type=desc`,
      );

      if (response.data.status === "success") {
        return response.data.ordens_servico;
      }
    });
    const results = await Promise.all(PromiseList);
    return results.flat();
  } catch (error) {
    console.error("Erro ao buscar ordens de serviço: " + error.message);
    alert("Erro ao buscar ordens de serviço");
  }
};

watch(hubsoftData, async () => {
  ordensServico.value = await getOrdensServico();
  chunkedOs.value = sliceInChunks(ordensServico.value, itemsPerPage);
});

onMounted(async () => {
  ordensServico.value = await getOrdensServico();
  chunkedOs.value = sliceInChunks(ordensServico.value, itemsPerPage);
});
</script>

<template>
  <v-expansion-panels variant="accordion">
    <v-expansion-panel title="Ordens de Serviço">
      <v-expansion-panel-text>
        <div class="d-flex flex-column justify-center flex-wrap ga-3">
          <v-card
            v-for="os in chunkedOs[page - 1]"
            :key="os.id_ordem_servico"
            :title="os.tipo"
            :subtitle="`Inicio ${os.data_inicio_executado || os.data_inicio_programado} - Termino ${os.data_termino_executado || os.data_termino_programado}`"
            variant="outlined"
          >
            <template #append>
              <v-btn
                :icon="os.status !== 'finalizado' ? 'mdi-alert' : 'mdi-check'"
                :color="os.status !== 'finalizado' ? 'red' : 'green'"
                variant="text"
              ></v-btn>
            </template>
            <v-card-text>
              <div class="d-flex flex-column ga-2">
                <div>
                  <p class="mb-2">
                    <strong
                      >DESCRIÇÃO DE ABERTURA ({{
                        os?.usuario_abertura
                      }})</strong
                    >
                  </p>
                  <p>{{ os?.descricao_abertura }}</p>
                </div>
                <v-divider></v-divider>
                <div>
                  <p class="mb-2">
                    <strong
                      >DESCRIÇÃO DE FECHAMENTO ({{
                        os?.usuario_fechamento
                      }})</strong
                    >
                  </p>
                  <p>{{ os?.descricao_fechamento }}</p>
                </div>
              </div>
            </v-card-text>
          </v-card>
          <v-pagination
            v-model="page"
            :length="chunkedOs.length"
            rounded="circle"
          ></v-pagination>
        </div>
      </v-expansion-panel-text>
    </v-expansion-panel>
  </v-expansion-panels>
</template>
