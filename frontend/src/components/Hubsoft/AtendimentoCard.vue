<script setup>
import { ref, onMounted, watch } from "vue";
import hubApi from "@/api/hubsoftApi";
import { useWindowSize } from "vue-window-size";

const hubsoftData = defineModel();

const atendimentos = ref([]);
const page = ref(1);
const itemsPerPage = 3;
const { width } = useWindowSize();

const chunkedAtendimentos = ref([]);

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

const getAtendimentos = async () => {
  try {
    const idClientList = hubsoftData.value.map(
      (client) => client.codigo_cliente,
    );

    const PromiseList = idClientList.map(async (id) => {
      const response = await hubApi.get(
        `/api/v1/integracao/cliente/atendimento?busca=codigo_cliente&termo_busca=${id}&apenas_pendente=nao&order_type=desc`,
      );

      if (response.data.status === "success") {
        return response.data.atendimentos;
      }
    });
    const results = await Promise.all(PromiseList);
    return results.flat();
  } catch (error) {
    console.error("Erro ao buscar atendimentos: " + error.message);
    alert("Erro ao buscar atendimentos");
  }
};

watch(hubsoftData, async () => {
  atendimentos.value = await getAtendimentos();
  chunkedAtendimentos.value = sliceInChunks(atendimentos.value, itemsPerPage);
});

onMounted(async () => {
  atendimentos.value = await getAtendimentos();
  chunkedAtendimentos.value = sliceInChunks(atendimentos.value, itemsPerPage);
});
</script>

<template>
  <v-expansion-panels variant="accordion">
    <v-expansion-panel title="Atendimentos">
      <v-expansion-panel-text>
        <div class="d-flex flex-column justify-center flex-wrap ga-3">
          <v-card
            v-for="atendimento in chunkedAtendimentos[page - 1]"
            :key="atendimento.id_atendimento"
            :title="atendimento.tipo_atendimento"
            :subtitle="`${atendimento.data_cadastro} ${atendimento.status}`"
            variant="outlined"
          >
            <template #append>
              <v-btn
                :icon="
                  atendimento.status !== 'Resolvido' ? 'mdi-alert' : 'mdi-check'
                "
                :color="atendimento.status !== 'Resolvido' ? 'red' : 'green'"
                variant="text"
              ></v-btn>
            </template>
            <v-card-text>
              <div class="d-flex flex-column ga-2">
                <div>
                  <p class="mb-2 text-wrap">
                    <strong
                      >DESCRIÇÃO DE ABERTURA ({{
                        atendimento?.usuario_abertura
                      }})</strong
                    >
                  </p>
                  <p>{{ atendimento.descricao_abertura }}</p>
                </div>
                <v-divider></v-divider>
                <div>
                  <p class="mb-2">
                    <strong
                      >DESCRIÇÃO DE FECHAMENTO ({{
                        atendimento?.usuario_fechamento
                      }})</strong
                    >
                  </p>
                  <p>{{ atendimento?.descricao_fechamento }}</p>
                </div>
              </div>
            </v-card-text>
          </v-card>
          <v-pagination
            v-model="page"
            :length="chunkedAtendimentos.length"
            rounded="circle"
            :total-visible="width < 600 ? 2 : 7"
          ></v-pagination>
        </div>
      </v-expansion-panel-text>
    </v-expansion-panel>
  </v-expansion-panels>
</template>
