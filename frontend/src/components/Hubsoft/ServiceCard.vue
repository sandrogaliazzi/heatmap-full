<script setup>
import { ref, onMounted } from "vue";
import fetchApi from "@/api";

const port = ref("443");
const protocol = ref("https");
const vendor = ref([]);

const servicos = defineModel();

const emit = defineEmits([
  "findClientOnHubsoft",
  "setOnuProvision",
  "resetMac",
  "enableService",
]);

defineProps(["cto", "vendor", "loading"]);

const openNewTab = (ipv4) => {
  if (!ipv4) return;
  window.open(`${protocol.value}://${ipv4}:${port.value}`, "_blank");
};

const getVendor = async (mac) => {
  if (!mac) return;
  try {
    const response = await fetchApi.get(`/getvendor/${mac}`);

    if (response.data.vendor.includes("errors")) vendor.value.push("N/A");
    else vendor.value.push(response.data.vendor);
  } catch (error) {
    console.error(error);
  }
};

onMounted(async () => {
  for (const service of servicos.value) {
    vendor.value.push(await getVendor(service.mac_addr));
  }
});
</script>
<template>
  <v-expansion-panels variant="accordion">
    <v-expansion-panel title="Mostrar serviços">
      <v-expansion-panel-text>
        <div class="d-flex flex-column justify-center flex-wrap ga-3">
          <v-card
            variant="tonal"
            class="mt-3"
            width="auto"
            :loading="loading"
            v-for="(service, index) in servicos"
            :title="service.nome"
            :color="service.ultima_conexao.conectado ? 'green' : 'red'"
            :key="service.id_serivco"
          >
            <template #append>
              <v-btn
                icon="mdi-reload"
                @click="emit('findClientOnHubsoft')"
              ></v-btn>
            </template>
            <v-card-item>
              <div>
                <div class="mb-1">
                  Status:
                  {{ service.status }}
                </div>
                <div class="text-caption">Pppoe: {{ service?.login }}</div>
                <div class="text-caption">Serviço: {{ service.nome }}</div>
                <div class="text-caption">
                  id_serivco: {{ service.id_cliente_servico }}
                </div>
                <div class="text-caption font-weight-bold">
                  Referencia: {{ service?.referencia }}
                </div>
                <div class="text-h6 mb-1">
                  Ipv4:
                  {{
                    service.ultima_conexao.ultimo_ipv4 || service.ipv4 || "-"
                  }}
                  <v-btn icon="mdi-open-in-new" variant="text">
                    <v-icon>mdi-open-in-new</v-icon>
                    <v-dialog max-width="600" activator="parent">
                      <template #default="{ isActive }">
                        <v-card>
                          <v-toolbar color="blue">
                            <v-toolbar-title
                              >Acessar Equipamento</v-toolbar-title
                            >
                            <v-btn
                              icon="mdi-close"
                              @click="isActive.value = false"
                            ></v-btn>
                          </v-toolbar>
                          <v-card-text>
                            <div
                              class="d-flex flex-column flex-md-row justify-center ga-3"
                            >
                              <v-text-field
                                label="https"
                                v-model="protocol"
                              ></v-text-field>
                              <v-text-field
                                :label="
                                  service.ultima_conexao.ultimo_ipv4 ||
                                  service.ipv4
                                "
                                :value="
                                  service.ultima_conexao.ultimo_ipv4 ||
                                  service.ipv4
                                "
                                readonly
                              ></v-text-field>
                              <v-text-field
                                label="443"
                                v-model="port"
                              ></v-text-field>
                              <v-btn
                                icon="mdi-open-in-new"
                                @click="
                                  openNewTab(service.ultima_conexao.ultimo_ipv4)
                                "
                                variant="text"
                              ></v-btn>
                            </div>
                          </v-card-text>
                        </v-card>
                      </template>
                    </v-dialog>
                  </v-btn>
                </div>
                <v-chip
                  :color="service.ultima_conexao.conectado ? 'green' : 'red'"
                  variant="flat"
                  size="x-small"
                  class="text-caption mb-1"
                  prepend-icon="mdi-timer-check"
                  >{{ service.ultima_conexao.status_txt_resumido }}</v-chip
                >
                <div class="text-h6 mb-1">
                  Mac: {{ service.mac_addr }}
                  <span>({{ vendor[index] }})</span>
                </div>
              </div>
            </v-card-item>
            <v-card-actions class="d-flex flex-wrap align-start">
              <div>
                <v-btn
                  v-if="cto"
                  @click="emit('setOnuProvision', service)"
                  variant="text"
                  >Provisionar Cpe</v-btn
                >
                <v-btn @click="emit('resetMac', service)" variant="text"
                  >Recapturar Mac</v-btn
                >
              </div>
              <div>
                <v-btn @click="emit('enableService', service)" variant="text"
                  >Habilitar serviço</v-btn
                >
              </div>
            </v-card-actions>
          </v-card>
        </div>
      </v-expansion-panel-text>
    </v-expansion-panel>
  </v-expansion-panels>
</template>
